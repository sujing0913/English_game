/**
 * 小店模块单元测试
 * @module minishop/__tests__/index.test.js
 */

// Mock wx-server-sdk
jest.mock('wx-server-sdk', () => {
  const mockChain = {
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    field: jest.fn(),
    get: jest.fn(),
    add: jest.fn(),
    doc: jest.fn()
  };

  const mockDatabase = {
    collection: jest.fn(() => mockChain),
    serverDate: jest.fn(() => new Date()),
    command: {
      in: jest.fn(),
      inc: jest.fn((val) => ({ type: 'inc', value: val }))
    },
    runTransaction: jest.fn()
  };

  // 设置链式调用
  mockChain.where.mockReturnValue(mockChain);
  mockChain.orderBy.mockReturnValue(mockChain);
  mockChain.limit.mockReturnValue(mockChain);
  mockChain.field.mockReturnValue(mockChain);
  mockChain.doc.mockReturnValue({
    get: jest.fn(),
    update: jest.fn(),
    remove: jest.fn()
  });

  return {
    init: jest.fn(),
    getWXContext: jest.fn(() => ({ OPENID: 'test_openid_123', APPID: 'wx36643b28e6254875' })),
    database: jest.fn(() => mockDatabase),
    DYNAMIC_CURRENT_ENV: 'env-123'
  };
});

// Mock common 模块
jest.mock('../../common', () => ({
  authMiddleware: jest.fn(() => Promise.resolve({ openid: 'test_openid_123', appId: 'wx36643b28e6254875' })),
  maskOpenid: jest.fn((openid) => 'o****1234'),
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  })),
  logException: jest.fn(),
  logExchange: jest.fn()
}));

const cloud = require('wx-server-sdk');
const { main } = require('../index');

describe('Minishop Module', () => {
  let db;
  let mockUsersColl;
  let mockOrdersColl;

  beforeEach(() => {
    jest.clearAllMocks();

    const { authMiddleware } = require('../../common');
    authMiddleware.mockResolvedValue({ openid: 'test_openid_123', appId: 'wx36643b28e6254875' });

    db = cloud.database();

    // 创建集合 mock 对象
    mockUsersColl = createMockCollection();
    mockOrdersColl = createMockCollection();

    // 根据 collection 名称返回不同的 mock
    db.collection.mockImplementation((name) => {
      if (name === 'users') return mockUsersColl;
      if (name === 'exchange_orders') return mockOrdersColl;
      if (name === 'products') return createMockCollection();
      return mockUsersColl;
    });
  });

  // 辅助函数：创建 mock collection
  function createMockCollection() {
    const mock = {
      where: jest.fn(),
      orderBy: jest.fn(),
      limit: jest.fn(),
      field: jest.fn(),
      get: jest.fn(),
      add: jest.fn(),
      doc: jest.fn()
    };

    // 设置链式调用
    mock.where.mockReturnValue(mock);
    mock.orderBy.mockReturnValue(mock);
    mock.limit.mockReturnValue(mock);
    mock.field.mockReturnValue(mock);
    mock.doc.mockReturnValue({
      get: jest.fn(),
      update: jest.fn(),
      remove: jest.fn()
    });

    return mock;
  }

  describe('getProducts', () => {
    it('获取商品列表成功', async () => {
      const result = await main({
        action: 'getProducts',
        category: 'all',
        limit: 20
      }, {});

      expect(result.code).toBe(0);
      expect(result.data.products).toBeDefined();
    });

    it('获取全部商品', async () => {
      const result = await main({
        action: 'getProducts',
        limit: 50
      }, {});

      expect(result.code).toBe(0);
      expect(result.data.products).toHaveLength(5);
    });

    it('限制数量不超过 50', async () => {
      const result = await main({
        action: 'getProducts',
        limit: 100
      }, {});

      expect(result.code).toBe(0);
    });
  });

  describe('exchange', () => {
    it('兑换商品成功', async () => {
      const mockUser = {
        _id: 'user_doc_123',
        openid: 'test_openid_123',
        virtualBalance: 1000,
        todayExchanged: 0
      };

      mockUsersColl.get.mockResolvedValue({ data: [mockUser] });

      // Mock 事务
      db.runTransaction.mockImplementation(async (fn) => {
        const mockTx = {
          collection: jest.fn(() => ({
            doc: jest.fn().mockReturnValue({
              update: jest.fn().mockResolvedValue({})
            }),
            where: jest.fn().mockReturnValue({
              update: jest.fn().mockResolvedValue({})
            }),
            add: jest.fn().mockResolvedValue({ _id: 'order_123' })
          }))
        };
        return fn(mockTx);
      });

      const result = await main({
        action: 'exchange',
        productId: 'toy_001',
        quantity: 1,
        receiver: {
          name: '张三',
          phone: '13800138000',
          address: '北京市朝阳区 xxx'
        }
      }, {});

      expect(result.code).toBe(0);
      expect(result.message).toBe('success');
    });

    it('参数不完整', async () => {
      const result = await main({
        action: 'exchange',
        productId: 'toy_001'
      }, {});

      expect(result.code).toBe(1002);
      expect(result.message).toContain('参数不完整');
    });

    it('商品不存在', async () => {
      const mockUser = {
        _id: 'user_doc_123',
        openid: 'test_openid_123',
        virtualBalance: 1000
      };

      mockUsersColl.get.mockResolvedValue({ data: [mockUser] });

      const result = await main({
        action: 'exchange',
        productId: 'invalid_product',
        quantity: 1,
        receiver: {
          name: '张三',
          phone: '13800138000',
          address: '北京市朝阳区 xxx'
        }
      }, {});

      expect(result.code).toBe(1013);
      expect(result.message).toContain('商品不存在');
    });

    it('商品库存不足', async () => {
      const mockUser = {
        _id: 'user_doc_123',
        openid: 'test_openid_123',
        virtualBalance: 1000
      };

      mockUsersColl.get.mockResolvedValue({ data: [mockUser] });

      const result = await main({
        action: 'exchange',
        productId: 'toy_001',
        quantity: 999,
        receiver: {
          name: '张三',
          phone: '13800138000',
          address: '北京市朝阳区 xxx'
        }
      }, {});

      expect(result.code).toBe(1013);
      expect(result.message).toContain('库存不足');
    });

    it('虚拟钱不足', async () => {
      const mockUser = {
        _id: 'user_doc_123',
        openid: 'test_openid_123',
        virtualBalance: 100
      };

      mockUsersColl.get.mockResolvedValue({ data: [mockUser] });

      const result = await main({
        action: 'exchange',
        productId: 'toy_003',
        quantity: 1,
        receiver: {
          name: '张三',
          phone: '13800138000',
          address: '北京市朝阳区 xxx'
        }
      }, {});

      expect(result.code).toBe(1002);
      expect(result.message).toContain('虚拟钱不足');
    });

    it('超过单日兑换限额', async () => {
      const mockUser = {
        _id: 'user_doc_123',
        openid: 'test_openid_123',
        virtualBalance: 10000,
        todayExchanged: 400
      };

      mockUsersColl.get.mockResolvedValue({ data: [mockUser] });

      const result = await main({
        action: 'exchange',
        productId: 'toy_001',
        quantity: 1,
        receiver: {
          name: '张三',
          phone: '13800138000',
          address: '北京市朝阳区 xxx'
        }
      }, {});

      expect(result.code).toBe(1014);
      expect(result.message).toContain('超过单日兑换限额');
    });

    it('收货信息不完整', async () => {
      const mockUser = {
        _id: 'user_doc_123',
        openid: 'test_openid_123',
        virtualBalance: 1000
      };

      mockUsersColl.get.mockResolvedValue({ data: [mockUser] });

      const result = await main({
        action: 'exchange',
        productId: 'toy_001',
        quantity: 1,
        receiver: {
          name: '张三',
          phone: '13800138000'
        }
      }, {});

      expect(result.code).toBe(1015);
      expect(result.message).toContain('不完整');
    });

    it('手机号格式不正确', async () => {
      const mockUser = {
        _id: 'user_doc_123',
        openid: 'test_openid_123',
        virtualBalance: 1000
      };

      mockUsersColl.get.mockResolvedValue({ data: [mockUser] });

      const result = await main({
        action: 'exchange',
        productId: 'toy_001',
        quantity: 1,
        receiver: {
          name: '张三',
          phone: '12345678901',
          address: '北京市朝阳区 xxx'
        }
      }, {});

      expect(result.code).toBe(1015);
      expect(result.message).toContain('手机号格式不正确');
    });

    it('用户未登录', async () => {
      const { authMiddleware } = require('../../common');
      authMiddleware.mockRejectedValue(new Error('OPENID is not available'));

      const result = await main({
        action: 'exchange',
        productId: 'toy_001',
        quantity: 1,
        receiver: {
          name: '张三',
          phone: '13800138000',
          address: '北京市朝阳区 xxx'
        }
      }, {});

      expect(result.code).toBe(1001);
      expect(result.message).toContain('未登录');
    });

    it('用户不存在', async () => {
      mockUsersColl.get.mockResolvedValue({ data: [] });

      const result = await main({
        action: 'exchange',
        productId: 'toy_001',
        quantity: 1,
        receiver: {
          name: '张三',
          phone: '13800138000',
          address: '北京市朝阳区 xxx'
        }
      }, {});

      expect(result.code).toBe(1003);
      expect(result.message).toContain('用户不存在');
    });

    it('事务失败回滚', async () => {
      const mockUser = {
        _id: 'user_doc_123',
        openid: 'test_openid_123',
        virtualBalance: 1000
      };

      mockUsersColl.get.mockResolvedValue({ data: [mockUser] });

      db.runTransaction.mockRejectedValue(new Error('事务失败'));

      const result = await main({
        action: 'exchange',
        productId: 'toy_001',
        quantity: 1,
        receiver: {
          name: '张三',
          phone: '13800138000',
          address: '北京市朝阳区 xxx'
        }
      }, {});

      expect(result.code).toBe(5000);
    });
  });

  describe('getOrders', () => {
    it('获取订单列表成功', async () => {
      const mockOrders = [
        {
          _id: 'order_001',
          userOpenid: 'test_openid_123',
          productId: 'toy_001',
          productName: '毛绒玩具 - 小熊',
          virtualPrice: 500,
          quantity: 1,
          orderStatus: 'pending',
          createdAt: Date.now() - 3600000
        }
      ];

      mockOrdersColl.get.mockResolvedValue({ data: mockOrders });

      const result = await main({
        action: 'getOrders',
        limit: 20
      }, {});

      expect(result.code).toBe(0);
      expect(result.data.orders).toBeDefined();
    });

    it('按状态筛选订单', async () => {
      mockOrdersColl.get.mockResolvedValue({ data: [] });

      await main({
        action: 'getOrders',
        status: 'pending'
      }, {});

      expect(mockOrdersColl.where).toHaveBeenCalled();
    });

    it('用户未登录', async () => {
      const { authMiddleware } = require('../../common');
      authMiddleware.mockRejectedValue(new Error('OPENID is not available'));

      const result = await main({
        action: 'getOrders'
      }, {});

      expect(result.code).toBe(1001);
    });

    it('获取订单失败', async () => {
      mockOrdersColl.get.mockRejectedValue(new Error('数据库错误'));

      const result = await main({
        action: 'getOrders'
      }, {});

      expect(result.code).toBe(5000);
    });
  });

  describe('未知 action', () => {
    it('返回未知 action 错误', async () => {
      const result = await main({
        action: 'invalidAction'
      }, {});

      expect(result.code).toBe(1001);
      expect(result.message).toContain('未知的 action');
    });
  });
});

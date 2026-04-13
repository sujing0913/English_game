/**
 * 交易模块单元测试
 * @module trading/__tests__/index.test.js
 */

// Mock wx-server-sdk
jest.mock('wx-server-sdk', () => {
  const mockDatabase = {
    collection: jest.fn(),
    serverDate: jest.fn(() => new Date()),
    command: {
      in: jest.fn(),
      inc: jest.fn((val) => ({ type: 'inc', value: val }))
    },
    runTransaction: jest.fn()
  };

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
  logException: jest.fn()
}));

const cloud = require('wx-server-sdk');
const { main } = require('../index');

describe('Trading Module', () => {
  let db;
  let mockListingsColl;
  let mockUsersColl;

  beforeEach(() => {
    jest.clearAllMocks();

    const { authMiddleware } = require('../../common');
    authMiddleware.mockResolvedValue({ openid: 'test_openid_123', appId: 'wx36643b28e6254875' });

    db = cloud.database();

    // 创建集合 mock 对象
    mockListingsColl = createMockCollection();
    mockUsersColl = createMockCollection();

    // 根据 collection 名称返回不同的 mock
    db.collection.mockImplementation((name) => {
      if (name === 'asset_listings') return mockListingsColl;
      if (name === 'users') return mockUsersColl;
      return mockListingsColl;
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

  describe('getListings', () => {
    it('获取交易行列表成功', async () => {
      const mockListings = [
        {
          _id: 'listing_001',
          itemId: 'land_4',
          itemType: 'land',
          price: 800,
          sellerOpenid: 'seller_a',
          createdAt: Date.now() - 3600000,
          status: 'on_sale'
        },
        {
          _id: 'listing_002',
          itemId: 'house_1',
          itemType: 'house',
          price: 2500,
          sellerOpenid: 'seller_b',
          createdAt: Date.now() - 7200000,
          status: 'on_sale'
        }
      ];

      mockListingsColl.get.mockResolvedValue({ data: mockListings });
      mockUsersColl.get.mockResolvedValue({ data: [
        { openid: 'seller_a', nickname: '玩家 A', avatar: 'avatar_a.png' },
        { openid: 'seller_b', nickname: '玩家 B', avatar: 'avatar_b.png' }
      ] });

      const result = await main({
        action: 'getListings',
        status: 'on_sale',
        sortBy: 'price_asc',
        limit: 20
      }, {});

      expect(result.code).toBe(0);
      expect(result.data.listings).toHaveLength(2);
      expect(result.data.hasMore).toBe(false);
    });

    it('按价格升序排序', async () => {
      mockListingsColl.get.mockResolvedValue({ data: [] });
      mockUsersColl.get.mockResolvedValue({ data: [] });

      const result = await main({
        action: 'getListings',
        sortBy: 'price_asc'
      }, {});

      expect(result.code).toBe(0);
      // 验证 orderBy 被调用
      expect(mockListingsColl.orderBy).toHaveBeenCalledWith('price', 'asc');
    });

    it('按价格降序排序', async () => {
      mockListingsColl.get.mockResolvedValue({ data: [] });

      await main({
        action: 'getListings',
        sortBy: 'price_desc'
      }, {});

      expect(mockListingsColl.orderBy).toHaveBeenCalledWith('price', 'desc');
    });

    it('按时间排序', async () => {
      mockListingsColl.get.mockResolvedValue({ data: [] });

      await main({
        action: 'getListings',
        sortBy: 'time'
      }, {});

      expect(mockListingsColl.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('默认按时间降序排序', async () => {
      mockListingsColl.get.mockResolvedValue({ data: [] });

      await main({
        action: 'getListings'
      }, {});

      expect(mockListingsColl.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('按类型筛选', async () => {
      mockListingsColl.get.mockResolvedValue({ data: [] });

      await main({
        action: 'getListings',
        itemType: 'land'
      }, {});

      expect(mockListingsColl.where).toHaveBeenCalledWith({
        itemType: 'land',
        status: 'on_sale'
      });
    });

    it('默认只返回出售中的', async () => {
      mockListingsColl.get.mockResolvedValue({ data: [] });

      await main({
        action: 'getListings'
      }, {});

      expect(mockListingsColl.where).toHaveBeenCalledWith({
        status: 'on_sale'
      });
    });

    it('限制数量不超过 50', async () => {
      mockListingsColl.get.mockResolvedValue({ data: [] });

      await main({
        action: 'getListings',
        limit: 100
      }, {});

      expect(mockListingsColl.limit).toHaveBeenCalledWith(50);
    });

    it('获取交易行失败', async () => {
      mockListingsColl.get.mockRejectedValue(new Error('数据库错误'));

      const result = await main({
        action: 'getListings'
      }, {});

      expect(result.code).toBe(5000);
      expect(result.message).toContain('获取交易行失败');
    });
  });

  describe('getMyListings', () => {
    it('获取我的挂单成功', async () => {
      const mockListings = [
        {
          _id: 'listing_001',
          itemId: 'land_4',
          itemType: 'land',
          price: 800,
          sellerOpenid: 'test_openid_123',
          status: 'on_sale',
          buyerOpenid: null,
          createdAt: Date.now() - 3600000,
          expireAt: Date.now() + 604800000
        },
        {
          _id: 'listing_002',
          itemId: 'house_1',
          itemType: 'house',
          price: 2500,
          sellerOpenid: 'test_openid_123',
          status: 'sold',
          buyerOpenid: 'buyer_openid',
          createdAt: Date.now() - 7200000,
          expireAt: Date.now() + 604800000
        }
      ];

      mockListingsColl.get.mockResolvedValue({ data: mockListings });

      const result = await main({
        action: 'getMyListings'
      }, {});

      expect(result.code).toBe(0);
      expect(result.data.listings).toHaveLength(2);
      expect(result.data.stats.onSale).toBe(1);
      expect(result.data.stats.sold).toBe(1);
    });

    it('按状态筛选我的挂单', async () => {
      mockListingsColl.get.mockResolvedValue({ data: [] });

      await main({
        action: 'getMyListings',
        status: 'on_sale'
      }, {});

      expect(mockListingsColl.where).toHaveBeenCalledWith({
        sellerOpenid: 'test_openid_123',
        status: 'on_sale'
      });
    });

    it('用户未登录', async () => {
      const { authMiddleware } = require('../../common');
      authMiddleware.mockRejectedValue(new Error('OPENID is not available'));

      const result = await main({
        action: 'getMyListings'
      }, {});

      expect(result.code).toBe(1001);
      expect(result.message).toContain('未登录');
    });

    it('获取我的挂单失败', async () => {
      mockListingsColl.get.mockRejectedValue(new Error('数据库错误'));

      const result = await main({
        action: 'getMyListings'
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

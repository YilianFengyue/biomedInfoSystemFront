// src/stores/herbStore.ts
import { defineStore } from 'pinia'
import type { Herb, PaginatedHerbs } from '@/api/herbApi' // 确保类型路径正确
import http from '@/api/http'

// 为每个页面的缓存数据定义接口
interface PageCache {
  items: Herb[]
  total: number
  expiry: number // 缓存过期时间戳
}

// 定义一个对象来存储不同查询条件下的缓存
interface QueryCache {
  [queryKey: string]: Record<number, PageCache>
}

// 图片缓存接口
interface ImageCache {
  [herbId: number]: {
    imageUrl: string
    expiry: number
  }
}

export const useHerbStore = defineStore('herb', {
  state: () => ({
    // 使用一个对象来存储不同查询下的缓存
    cachedQueries: {} as QueryCache,
    // 图片缓存
    imageCache: {} as ImageCache,
    cacheDuration: 30 * 60 * 1000, // 缓存30分钟
    imageCacheDuration: 60 * 60 * 1000 // 图片缓存1小时
  }),

  actions: {
    /**
     * 根据查询参数和页码生成唯一的缓存键
     * @param params - 查询参数对象
     * @returns 字符串形式的缓存键
     */
    getCacheKey(params: any): string {
      // 对参数对象的键进行排序，以确保不同顺序的相同参数能生成相同的键
      const sortedKeys = Object.keys(params).sort();
      return sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    },

    /**
     * 尝试从缓存中获取页面数据
     * @param queryKey - 查询条件的字符串键
     * @param page - 页码
     * @returns 如果缓存有效则返回药材列表及总数，否则返回 null
     */
    getFromCache(queryKey: string, page: number): { records: Herb[], total: number } | null {
      const queryCache = this.cachedQueries[queryKey]
      if (!queryCache) {
        return null
      }
      
      const pageCache = queryCache[page]
      if (pageCache && Date.now() < pageCache.expiry) {
        console.log(`从缓存加载查询 "${queryKey}" 的第 ${page} 页数据`)
        return { records: pageCache.items, total: pageCache.total }
      }
      return null
    },

    /**
     * 将获取到的数据存入缓存
     * @param queryKey - 查询条件的字符串键
     * @param page - 页码
     * @param items - 药材列表数据
     * @param total - 总项目数
     */
    setCache(queryKey: string, page: number, items: Herb[], total: number) {
      if (!this.cachedQueries[queryKey]) {
        this.cachedQueries[queryKey] = {}
      }
      this.cachedQueries[queryKey][page] = {
        items,
        total,
        expiry: Date.now() + this.cacheDuration
      }
      console.log(`缓存查询 "${queryKey}" 的第 ${page} 页数据`)
    },

    /**
     * 获取缓存的图片URL
     * @param herbId - 药材ID
     * @returns 如果缓存有效则返回图片URL，否则返回 null
     */
    getCachedImage(herbId: number): string | null {
      const imageCache = this.imageCache[herbId]
      if (imageCache && Date.now() < imageCache.expiry) {
        console.log(`从缓存加载药材 ${herbId} 的图片`)
        return imageCache.imageUrl
      }
      return null
    },

    /**
     * 缓存图片URL
     * @param herbId - 药材ID
     * @param imageUrl - 图片URL
     */
    setCachedImage(herbId: number, imageUrl: string) {
      this.imageCache[herbId] = {
        imageUrl,
        expiry: Date.now() + this.imageCacheDuration
      }
      console.log(`缓存药材 ${herbId} 的图片`)
    },

    /**
     * 批量获取药材图片
     * @param herbs - 药材列表
     * @returns 带图片的药材列表
     */
    async fetchHerbsImages(herbs: Herb[]): Promise<Herb[]> {
      const herbsWithImages = [...herbs] // 创建副本避免修改原数组
      
      // 找出需要请求图片的药材
      const herbsNeedingImages = herbsWithImages.filter(herb => {
        const cachedImage = this.getCachedImage(herb.id)
        if (cachedImage) {
          herb.imageUrl = cachedImage
          return false
        }
        return true
      })

      if (herbsNeedingImages.length === 0) {
        return herbsWithImages
      }

      console.log(`需要请求 ${herbsNeedingImages.length} 个药材的图片`)

      // 批量请求图片
      const imagePromises = herbsNeedingImages.map((herb) =>
        http
          .get<any>(`/herb/herbs/${herb.id}/images`)
          .catch(() => ({ data: { data: [] } }))
      )

      const imageResults = await Promise.all(imagePromises)

      // 处理图片结果并缓存
      herbsNeedingImages.forEach((herb, index) => {
        const images = imageResults[index]?.data?.data
        if (images && images.length > 0) {
          herb.imageUrl = images[0]
          this.setCachedImage(herb.id, images[0])
        }
      })

      return herbsWithImages
    },

    /**
     * 获取带图片缓存的药材列表
     * @param page - 页码
     * @param itemsPerPage - 每页数量
     * @param params - 筛选参数
     * @returns PaginatedHerbs
     */
    async fetchHerbsWithCache(page: number, itemsPerPage: number, params: any) {
      const queryKey = this.getCacheKey(params);
      const cachedData = this.getFromCache(queryKey, page);

      if (cachedData) {
        // 即使有缓存数据，也要检查图片缓存
        const herbsWithImages = await this.fetchHerbsImages(cachedData.records)
        return { records: herbsWithImages, total: cachedData.total };
      }

      console.log(`从 API 获取查询 "${queryKey}" 的第 ${page} 页数据`);
      const apiParams = { ...params, page, limit: itemsPerPage };
      
      const response = await http.get<{ data: PaginatedHerbs }>('/herb/herbs', { params: apiParams });
      const { records: fetchedHerbs, total } = response.data.data;

      if (fetchedHerbs && fetchedHerbs.length > 0) {
        // 获取图片并缓存
        const herbsWithImages = await this.fetchHerbsImages(fetchedHerbs)
        this.setCache(queryKey, page, herbsWithImages, total);
        return { records: herbsWithImages, total };
      }

      return { records: [], total: 0 };
    },

    /**
     * 清除过期的缓存
     */
    clearExpiredCache() {
      const now = Date.now()
      
      // 清理查询缓存
      Object.keys(this.cachedQueries).forEach(queryKey => {
        const queryCache = this.cachedQueries[queryKey]
        Object.keys(queryCache).forEach(page => {
          const pageNum = parseInt(page)
          if (queryCache[pageNum].expiry < now) {
            delete queryCache[pageNum]
          }
        })
        if (Object.keys(queryCache).length === 0) {
          delete this.cachedQueries[queryKey]
        }
      })

      // 清理图片缓存
      Object.keys(this.imageCache).forEach(herbId => {
        const herbIdNum = parseInt(herbId)
        if (this.imageCache[herbIdNum].expiry < now) {
          delete this.imageCache[herbIdNum]
        }
      })

      console.log('清理过期缓存完成')
    }
  },

  // 开启 Pinia 持久化
  persist: {
    enabled: true,
    strategies: [{ 
      storage: localStorage, 
      paths: ['cachedQueries', 'imageCache'] 
    }],
  }
})
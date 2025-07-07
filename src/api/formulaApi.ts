import http from './http';

// 根据SQL文件中的 `formula` 表，精确定义方剂类型
export interface Formula {
  id: number;
  name: string;
  alias: string | null;
  source: string | null;
  dynasty: string | null;
  author: string | null;
  composition: string | null;
  function_effect: string | null;
  main_treatment: string | null;
  usage_frequency: number;
  status: number; // 1-正常 0-禁用
  created_at: string;
}

// 分页响应类型
export interface PaginatedFormulas {
  items: Formula[];
  total: number;
  page: number;
  pages: number;
}

// 查询参数类型
export interface FormulaQuery {
  page: number;
  per_page: number;
  keyword?: string;
  source?: string;
  category_id?: number;
}

/**
 * @description 获取方剂列表（带分页和筛选）
 * @param {FormulaQuery} params - 查询参数
 * @returns {Promise<PaginatedFormulas>}
 */
export const getFormulas = async (params: FormulaQuery): Promise<PaginatedFormulas> => {
  try {
    const response = await http.get('/api/formulas/list', { params });
    if (response.data.code === 20000 && response.data.data) {
      return response.data.data;
    }
    return { items: [], total: 0, page: params.page, pages: 0 };
  } catch (error) {
    console.error('获取方剂列表失败:', error);
    return { items: [], total: 0, page: params.page, pages: 0 };
  }
};
import http from './http';

// 定义从后端接收的节点和链接的类型
export interface GraphNode {
  id: string;       
  name: string;
  category: string; 
  symbolSize: number;
}

export interface GraphLink {
  source: string;
  target: string;
  label?: {
    show: boolean;
    formatter: string;
  };
}

// 定义API响应的数据结构
export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// 定义支持的实体类型
export type EntityType = 'formula' | 'disease' | 'herb' | 'symptom' | 'syndrome' | 'meridian' | 'acupoint';


export const getGraphData = async (entityType: EntityType, keyword: string): Promise<KnowledgeGraphData> => {
  if (!entityType || !keyword) {
    return { nodes: [], links: [] };
  }

  const endpoint = `/graph/${entityType}/${encodeURIComponent(keyword)}`;

  try {
    const response = await http.get<KnowledgeGraphData>(endpoint);

    // 因为拦截器已处理，现在 response.data 就是我们需要的 {nodes, links} 对象
    const data = response.data;
    if (data && Array.isArray(data.nodes) && Array.isArray(data.links)) {
      return data;
    }
    return { nodes: [], links: [] };

  } catch (error: any) {
    console.error(`知识图谱检索失败 for ${entityType} - ${keyword}:`, error);
    return { nodes: [], links: [] };
  }
};
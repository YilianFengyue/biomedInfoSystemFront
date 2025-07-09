// 科研平台API服务
// import axios from "axios";
import axios from "@/api/http";
// 类型定义
export interface Project {
  id: number;
  projectName: string;
  projectCode: string;
  projectType: string;
  fundingSource: string;
  fundingAmount: number;
  principalInvestigatorName?: string;
  startDate: string;
  endDate: string;
  status: string;
  researchField: string;
  abstractText?: string;
  keywords?: string;
  createdAt: string;
  memberCount: number;
  taskCount: number;
}

export interface Task {
  id: number;
  projectId: number;
  studentId: number;
  title: string;
  description: string;
  requirements: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  createdAt: string;
   // 🔥 根据API文档补充的字段
  projectName?: string;     // 项目名称
  studentName?: string;     // 学生姓名  
  progress: number;         // 进度百分比
}

export interface Application {
  id: number;
  projectId: number;
  studentId: number;
  applicationReason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewComment?: string;
  createdAt: string;
}

export interface Submission {
  id: number;
  taskId: number;
  title: string;
  abstractText: string;
  keywords: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  submissionNotes: string;
  status: string;
  createdAt: string;
}

export interface Review {
  id: number;
  submissionId: number;
  overallScore: number;
  contentScore: number;
  innovationScore: number;
  methodologyScore: number;
  writingScore: number;
  reviewComment: string;
  suggestions: string;
  reviewResult: string;
  isFinal: boolean;
  createdAt: string;
}

// API响应类型
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

interface PagedResponse<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 教师端API
export const teacherApi = {
  // 课题管理
  projects: {
    create: (data: Partial<Project>) => 
      axios.post<ApiResponse<Project>>('/teacher/research/projects', data),
      
    list: (params?: { page?: number; size?: number; keyword?: string; projectType?: string; status?: string }) => 
      axios.get<ApiResponse<PagedResponse<Project>>>('/teacher/research/projects', { params }),
      
    get: (id: number) => 
      axios.get<ApiResponse<Project>>(`/teacher/research/projects/${id}`),
      
    update: (id: number, data: Partial<Project>) => 
      axios.put<ApiResponse<Project>>(`/teacher/research/projects/${id}`, data),
      
    delete: (id: number) => 
      axios.delete<ApiResponse<void>>(`/teacher/research/projects/${id}`)
  },
  
  // 申请审核
  applications: {
    list: (params?: { page?: number; size?: number; projectId?: number }) =>
      axios.get<ApiResponse<PagedResponse<Application>>>('/teacher/research/applications', { params }),
      
    review: (data: { applicationId: number; action: 'approve' | 'reject'; reviewComment: string }) =>
      axios.post<ApiResponse<void>>('/teacher/research/applications/review', data),
      
    getByProject: (projectId: number) =>
      axios.get<ApiResponse<Application[]>>(`/teacher/research/projects/${projectId}/applications`)
  },
  
  // 任务管理
  tasks: {
    create: (data: Partial<Task>) =>
      axios.post<ApiResponse<Task>>('/teacher/research/tasks', data),
      
    list: (params?: { page?: number; size?: number; projectId?: number }) =>
      axios.get<ApiResponse<PagedResponse<Task>>>('/teacher/research/tasks', { params }),
      
    update: (id: number, data: Partial<Task>) =>
      axios.put<ApiResponse<Task>>(`/teacher/research/tasks/${id}`, data),
      
    delete: (id: number) =>
      axios.delete<ApiResponse<void>>(`/teacher/research/tasks/${id}`),
      
    getSubmissions: (taskId: number) =>
      axios.get<ApiResponse<Submission[]>>(`/teacher/research/tasks/${taskId}/submissions`)
  },
  
  // 论文评审
  reviews: {
    getPending: (params?: { page?: number; size?: number }) =>
      axios.get<ApiResponse<PagedResponse<Submission>>>('/teacher/research/submissions/pending', { params }),
      
    getSubmission: (id: number) =>
      axios.get<ApiResponse<Submission>>(`/teacher/research/submissions/${id}`),
      
    create: (data: Partial<Review>) =>
      axios.post<ApiResponse<Review>>('/teacher/research/reviews', data),
      
    update: (id: number, data: Partial<Review>) =>
      axios.put<ApiResponse<Review>>(`/teacher/research/reviews/${id}`, data)
  }
};

// 学生端API
export const studentApi = {
  // 课题浏览与申请
  projects: {
    getAvailable: (params?: { page?: number; size?: number; keyword?: string; projectType?: string; researchField?: string }) =>
      axios.get<ApiResponse<PagedResponse<Project>>>('/student/research/projects/available', { params }),
      
    get: (id: number) =>
      axios.get<ApiResponse<Project>>(`/student/research/projects/${id}`),
      
    apply: (projectId: number, applicationReason: string) =>
      axios.post<ApiResponse<void>>('/student/research/applications', null, {
        params: { projectId, applicationReason }
      }),
      
    getApplications: () =>
      axios.get<ApiResponse<Application[]>>('/student/research/applications'),
      
    withdrawApplication: (applicationId: number) =>
      axios.delete<ApiResponse<void>>(`/student/research/applications/${applicationId}`)
  },
  
  // 任务管理
  tasks: {
    list: (params?: { page?: number; size?: number }) =>
      axios.get<ApiResponse<PagedResponse<Task>>>('/student/research/tasks', { params }),
      
    get: (id: number) =>
      axios.get<ApiResponse<Task>>(`/student/research/tasks/${id}`),
      
    updateStatus: (id: number, status: string) =>
      axios.put<ApiResponse<void>>(`/student/research/tasks/${id}/status`, null, {
        params: { status }
      }),
      
    updateProgress: (id: number, progressContent: string) =>
      axios.post<ApiResponse<void>>(`/student/research/tasks/${id}/progress`, null, {
        params: { progressContent }
      }),
      
    getProgress: (taskId: number) =>
      axios.get<ApiResponse<any[]>>(`/student/research/tasks/${taskId}/progress`)
  },
  
  // 论文提交
  submissions: {
    create: (taskId: number, data: Partial<Submission>) =>
      axios.post<ApiResponse<Submission>>('/student/research/submissions', data, {
        params: { taskId }
      }),
      
    list: () =>
      axios.get<ApiResponse<Submission[]>>('/student/research/submissions'),
      
    update: (id: number, data: Partial<Submission>) =>
      axios.put<ApiResponse<Submission>>(`/student/research/submissions/${id}`, data),
      
    getReviews: (submissionId: number) =>
      axios.get<ApiResponse<Review[]>>(`/student/research/submissions/${submissionId}/reviews`)
  }
};

// 通用API
export const commonApi = {
  // 项目统计
  getProjectStatistics: (projectId: number) =>
    axios.get<ApiResponse<any>>(`/research/projects/${projectId}/statistics`),
    
  // 项目成果
  getProjectAchievements: (projectId: number) =>
    axios.get<ApiResponse<any>>(`/research/projects/${projectId}/achievements`),
    
  // 文件上传
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post<ApiResponse<string>>('/research/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // 文件下载
  downloadFile: (fileUrl: string) =>
    axios.get('/research/download', {
      params: { fileUrl },
      responseType: 'blob'
    })
};
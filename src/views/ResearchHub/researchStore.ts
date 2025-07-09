// 科研平台状态管理
import { defineStore } from 'pinia';
import { teacherApi, studentApi, commonApi, type Project, type Task, type Application, type Submission, type Review } from './researchApi';

interface ResearchState {
  // 项目相关
  projects: Project[];
  currentProject: Project | null;
  projectsLoading: boolean;
  
  // 任务相关
  tasks: Task[];
  currentTask: Task | null;
  tasksLoading: boolean;
  
  // 申请相关
  applications: Application[];
  applicationsLoading: boolean;
  
  // 论文相关
  submissions: Submission[];
  currentSubmission: Submission | null;
  submissionsLoading: boolean;
  
  // 评审相关
  reviews: Review[];
  reviewsLoading: boolean;
  
  // 分页信息
  pagination: {
    total: number;
    current: number;
    size: number;
    pages: number;
  };
  
  // 用户角色
  userRole: 'teacher' | 'student' | null;
}

export const useResearchStore = defineStore('research', {
  state: (): ResearchState => ({
    projects: [],
    currentProject: null,
    projectsLoading: false,
    
    tasks: [],
    currentTask: null,
    tasksLoading: false,
    
    applications: [],
    applicationsLoading: false,
    
    submissions: [],
    currentSubmission: null,
    submissionsLoading: false,
    
    reviews: [],
    reviewsLoading: false,
    
    pagination: {
      total: 0,
      current: 1,
      size: 10,
      pages: 0
    },
    
    userRole: null
  }),
  
  getters: {
    // 获取进行中的项目
    activeProjects: (state) => 
      state.projects.filter(p => p.status === 'active'),
      
    // 获取待处理的申请
    pendingApplications: (state) =>
      state.applications.filter(a => a.status === 'pending'),
      
    // 获取高优先级任务
    highPriorityTasks: (state) =>
      state.tasks.filter(t => t.priority === 'high'),
      
    // 获取待评审的论文
    pendingSubmissions: (state) =>
      state.submissions.filter(s => s.status === 'pending')
  },
  
  actions: {
    // 设置用户角色
    setUserRole(role: 'teacher' | 'student') {
      this.userRole = role;
    },
    
    // ========== 项目相关 ==========
    
    // 获取项目列表
    async fetchProjects(params?: any) {
      this.projectsLoading = true;
      try {
        const api = this.userRole === 'teacher' ? teacherApi : studentApi;
        const endpoint = this.userRole === 'teacher' ? 'list' : 'getAvailable';
        const { data } = await api.projects[endpoint](params);
        
        if (data.code === 20000) {
          this.projects = data.data.records;
          this.pagination = {
            total: data.data.total,
            current: data.data.current,
            size: data.data.size,
            pages: data.data.pages
          };
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        throw error;
      } finally {
        this.projectsLoading = false;
      }
    },
    
    // 获取项目详情
    async fetchProjectDetail(id: number) {
      try {
        const api = this.userRole === 'teacher' ? teacherApi : studentApi;
        const { data } = await api.projects.get(id);
        
        if (data.code === 20000) {
          this.currentProject = data.data;
        }
      } catch (error) {
        console.error('Failed to fetch project detail:', error);
        throw error;
      }
    },
    
    // 创建项目（教师）
    async createProject(projectData: Partial<Project>) {
      try {
        const { data } = await teacherApi.projects.create(projectData);
        
        if (data.code === 20000) {
          this.projects.unshift(data.data);
          return data.data;
        }
      } catch (error) {
        console.error('Failed to create project:', error);
        throw error;
      }
    },
    
    // 更新项目（教师）
    async updateProject(id: number, projectData: Partial<Project>) {
      try {
        const { data } = await teacherApi.projects.update(id, projectData);
        
        if (data.code === 20000) {
          const index = this.projects.findIndex(p => p.id === id);
          if (index !== -1) {
            this.projects[index] = data.data;
          }
          if (this.currentProject?.id === id) {
            this.currentProject = data.data;
          }
          return data.data;
        }
      } catch (error) {
        console.error('Failed to update project:', error);
        throw error;
      }
    },
    
    // 删除项目（教师）
    async deleteProject(id: number) {
      try {
        const { data } = await teacherApi.projects.delete(id);
        
        if (data.code === 20000) {
          this.projects = this.projects.filter(p => p.id !== id);
        }
      } catch (error) {
        console.error('Failed to delete project:', error);
        throw error;
      }
    },
    
    // ========== 申请相关 ==========
    
    // 申请加入项目（学生）
    async applyForProject(projectId: number, reason: string) {
      try {
        const { data } = await studentApi.projects.apply(projectId, reason);
        
        if (data.code === 20000) {
          // 刷新申请列表
          await this.fetchMyApplications();
        }
      } catch (error) {
        console.error('Failed to apply for project:', error);
        throw error;
      }
    },
    
    // 获取我的申请（学生）
    async fetchMyApplications() {
      this.applicationsLoading = true;
      try {
        const { data } = await studentApi.projects.getApplications();
        
        if (data.code === 20000) {
          this.applications = data.data;
        }
      } catch (error) {
        console.error('Failed to fetch applications:', error);
        throw error;
      } finally {
        this.applicationsLoading = false;
      }
    },
    
    // 获取待审核申请（教师）
    async fetchPendingApplications(params?: any) {
      this.applicationsLoading = true;
      try {
        const { data } = await teacherApi.applications.list(params);
        
        if (data.code === 20000) {
          this.applications = data.data.records;
          this.pagination = {
            total: data.data.total,
            current: data.data.current,
            size: data.data.size,
            pages: data.data.pages
          };
        }
      } catch (error) {
        console.error('Failed to fetch pending applications:', error);
        throw error;
      } finally {
        this.applicationsLoading = false;
      }
    },
    
    // 审核申请（教师）
    async reviewApplication(applicationId: number, action: 'approve' | 'reject', comment: string) {
      try {
        const { data } = await teacherApi.applications.review({
          applicationId,
          action,
          reviewComment: comment
        });
        
        if (data.code === 20000) {
          // 更新申请状态
          const application = this.applications.find(a => a.id === applicationId);
          if (application) {
            application.status = action === 'approve' ? 'approved' : 'rejected';
            application.reviewComment = comment;
          }
        }
      } catch (error) {
        console.error('Failed to review application:', error);
        throw error;
      }
    },
    
    // ========== 任务相关 ==========
    
    // 获取任务列表
    async fetchTasks(params?: any) {
      this.tasksLoading = true;
      try {
        const api = this.userRole === 'teacher' ? teacherApi : studentApi;
        const { data } = await api.tasks.list(params);
        
        if (data.code === 20000) {
          this.tasks = data.data.records;
          this.pagination = {
            total: data.data.total,
            current: data.data.current,
            size: data.data.size,
            pages: data.data.pages
          };
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        throw error;
      } finally {
        this.tasksLoading = false;
      }
    },
    
    // 创建任务（教师）
    async createTask(taskData: Partial<Task>) {
      try {
        const { data } = await teacherApi.tasks.create(taskData);
        
        if (data.code === 20000) {
          this.tasks.unshift(data.data);
          return data.data;
        }
      } catch (error) {
        console.error('Failed to create task:', error);
        throw error;
      }
    },
    
    // 更新任务状态（学生）
    async updateTaskStatus(taskId: number, status: string) {
      try {
        const { data } = await studentApi.tasks.updateStatus(taskId, status);
        
        if (data.code === 20000) {
          const task = this.tasks.find(t => t.id === taskId);
          if (task) {
            task.status = status;
          }
        }
      } catch (error) {
        console.error('Failed to update task status:', error);
        throw error;
      }
    },
    
    // 更新任务进度（学生）
    async updateTaskProgress(taskId: number, progressContent: string) {
      try {
        const { data } = await studentApi.tasks.updateProgress(taskId, progressContent);
        
        if (data.code === 20000) {
          // 可以触发进度列表刷新
          return true;
        }
      } catch (error) {
        console.error('Failed to update task progress:', error);
        throw error;
      }
    },
    
    // ========== 论文相关 ==========
    
    // 提交论文（学生）
    async submitPaper(taskId: number, submissionData: Partial<Submission>) {
      try {
        const { data } = await studentApi.submissions.create(taskId, submissionData);
        
        if (data.code === 20000) {
          this.submissions.unshift(data.data);
          return data.data;
        }
      } catch (error) {
        console.error('Failed to submit paper:', error);
        throw error;
      }
    },
    
    // 获取待评审论文（教师）
    async fetchPendingSubmissions(params?: any) {
      this.submissionsLoading = true;
      try {
        const { data } = await teacherApi.reviews.getPending(params);
        
        if (data.code === 20000) {
          this.submissions = data.data.records;
          this.pagination = {
            total: data.data.total,
            current: data.data.current,
            size: data.data.size,
            pages: data.data.pages
          };
        }
      } catch (error) {
        console.error('Failed to fetch pending submissions:', error);
        throw error;
      } finally {
        this.submissionsLoading = false;
      }
    },
    
    // 提交评审（教师）
    async submitReview(reviewData: Partial<Review>) {
      try {
        const { data } = await teacherApi.reviews.create(reviewData);
        
        if (data.code === 20000) {
          this.reviews.push(data.data);
          return data.data;
        }
      } catch (error) {
        console.error('Failed to submit review:', error);
        throw error;
      }
    },
    
    // ========== 通用功能 ==========
    
    // 上传文件
    async uploadFile(file: File) {
      try {
        const { data } = await commonApi.uploadFile(file);
        
        if (data.code === 20000) {
          return data.data; // 返回文件URL
        }
      } catch (error) {
        console.error('Failed to upload file:', error);
        throw error;
      }
    },
    
    // 获取项目统计
    async fetchProjectStatistics(projectId: number) {
      try {
        const { data } = await commonApi.getProjectStatistics(projectId);
        
        if (data.code === 20000) {
          return data.data;
        }
      } catch (error) {
        console.error('Failed to fetch project statistics:', error);
        throw error;
      }
    },
    
    // 暴露API给组件使用
    get teacherApi() {
      return teacherApi;
    },
    
    get studentApi() {
      return studentApi;
    },
    
    get commonApi() {
      return commonApi;
    }
  }
});
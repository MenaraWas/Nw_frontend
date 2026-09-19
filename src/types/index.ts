export type Role = 'PM' | 'INTERNAL' | 'CLIENT'
export type Department = 'PRODUCT' | 'UIUX' | 'FRONTEND' | 'BACKEND'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'

export interface User {
    id: string
    name: string
    email: string
    role: Role
    department?: Department
}

export interface Project {
    id: string
    name: string
    description?: string
    members?: ProjectMember[]
    tasks?: Task[]
}

export interface ProjectMember {
    id: string
    projectId: string
    userId: string
    user: User
}

export interface Task {
    id: string
    projectId: string
    title: string
    description?: string
    status: TaskStatus
    assigneeId?: string
    assignee?: Pick<User, 'id' | 'name' | 'department'>
    clientVisible: boolean
    version: number
    dependencies?: TaskDependency[]
    auditLogs?: AuditLog[]
    createdAt: string
    updatedAt: string
}

export interface TaskDependency {
  id: string
  dependentId: string
  prerequisiteId: string
  prerequisite: Pick<Task, 'id' | 'title' | 'status'>
}

export interface AuditLog {
  id: string
  taskId: string
  userId: string
  column: string
  oldValue?: string
  newValue?: string
  createdAt: string
  user: Pick<User, 'id' | 'name'>
}

export interface ClientProject {
  id: string
  name: string
  description?: string
  progress: string
  tasks: Pick<Task, 'id' | 'title' | 'status'>[]
}

export interface ApiResponse<T> {
  data: T
  message?: string
}
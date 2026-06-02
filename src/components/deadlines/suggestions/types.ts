export interface SuggestionDonor {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface TransferSuggestion {
  fromId: string;
  fromName: string;
  fromAvatar?: string;
  hoursOnProject: number;
  suggestedHours: number;
  reason: string;
}

export interface ProjectRecommendation {
  projectId: string;
  projectName: string;
  transfers: TransferSuggestion[];
}

export interface EmployeeRecommendation {
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  deficitHours: number;
  projects: ProjectRecommendation[];
}

export interface CapacityResult {
  available: number;
}

export interface EmployeeOption {
  id: string;
  name: string;
  avatarUrl?: string;
  loadPct: number;
  subtitle?: string;
}

export interface DonorTransferRow {
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  projectId: string;
  projectName: string;
  transfer: TransferSuggestion;
}

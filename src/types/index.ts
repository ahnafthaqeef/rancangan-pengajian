export interface Plan {
  id: string;
  user_id: string;
  date: string;
  subject: string;
  objective: string;
  created_at: string;
  activities?: Activity[];
}

export interface Activity {
  id: string;
  plan_id: string;
  title: string;
  done: boolean;
  done_at?: string;
  sort_order: number;
  created_at: string;
}

export interface PlanWithStats extends Plan {
  activities: Activity[];
  completed: number;
  total: number;
}

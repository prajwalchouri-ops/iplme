export type Match = {
  id: string;
  home_team: string;
  away_team: string;
  starts_at: string;
  venue: string;
  city: string;
  status: "scheduled" | "live" | "completed";
  created_at: string;
};

export type Booking = {
  id: string;
  match_id: string;
  user_id: string;
  full_name: string;
  email: string;
  seats: number;
  booking_status: "confirmed" | "cancelled";
  created_at: string;
};

type Table<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      matches: Table<Match, Omit<Match, "id" | "created_at"> & Partial<Pick<Match, "id" | "created_at">>>;
      bookings: Table<Booking, Omit<Booking, "id" | "created_at"> & Partial<Pick<Booking, "id" | "created_at">>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
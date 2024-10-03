import { supabaseMock } from "./supabase";

export const createClient = jest.fn().mockReturnValue(supabaseMock);

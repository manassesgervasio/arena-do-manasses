import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://daqbtyqekjfeqawjbakm.supabase.co/rest/v1/";
const supabaseKey = "sb_publishable_PiunQ0jlm-971TOlHnA-5A_K9LDACFA";

export const supabase = createClient(supabaseUrl, supabaseKey);
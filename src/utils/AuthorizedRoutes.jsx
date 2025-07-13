import { Navigate, useLocation } from "react-router-dom";
import supabase from "./supabase";
import { useState, useEffect } from "react";

export default function AuthorizedRoute({ children }) {
  const location = useLocation();
  const [session, setSession] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error(error);
        return;
      }
      setSession(data.session);
    };
    fetchSession();
  }, []);

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  return children;
}

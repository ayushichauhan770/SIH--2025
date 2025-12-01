import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export function SessionGuard() {
      const { user, logout } = useAuth();
      const { toast } = useToast();

      useEffect(() => {
            const checkSession = () => {
                  try {
                        const storedUserStr = sessionStorage.getItem("user");
                        if (!storedUserStr) return; // No session, let auth context handle it

                        const storedUser = JSON.parse(storedUserStr);

                        // If the user in local storage is different from the user in memory
                        if (user && storedUser.id !== user.id) {
                              console.warn("Session mismatch detected! Another user logged in?");

                              toast({
                                    title: "Session Changed",
                                    description: "You have logged in as a different user in another tab. Refreshing...",
                                    variant: "destructive",
                                    duration: 5000
                              });

                              // Force reload to sync with new session
                              setTimeout(() => {
                                    window.location.reload();
                              }, 1500);
                        }
                  } catch (e) {
                        console.error("Session check failed", e);
                  }
            };

            // Check immediately
            checkSession();

            // Check every second (or on focus)
            const interval = setInterval(checkSession, 1000);

            // Also check when window gains focus
            window.addEventListener("focus", checkSession);

            return () => {
                  clearInterval(interval);
                  window.removeEventListener("focus", checkSession);
            };
      }, [user, toast]);

      return null;
}

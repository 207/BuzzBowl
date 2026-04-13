import { useNavigate, useLocation } from "react-router-dom";
import { Home } from "lucide-react";

const HomeButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/") return null;

  return (
    <button
      onClick={() => navigate("/")}
      className="fixed top-5 left-5 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/80 border border-border/50 backdrop-blur-sm text-sm font-body font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
    >
      <Home className="w-4 h-4" />
      Home
    </button>
  );
};

export default HomeButton;

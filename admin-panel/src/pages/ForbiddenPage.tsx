import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function ForbiddenPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <ShieldAlert className="h-14 w-14 text-amber-600" />
      <h1 className="text-xl font-semibold text-zinc-900">Erişim reddedildi</h1>
      <p className="max-w-md text-sm text-zinc-600">
        Bu alan yalnızca süper yöneticiler içindir.
      </p>
      <Button asChild variant="outline">
        <Link to="/dashboard">Panele dön</Link>
      </Button>
    </div>
  );
}

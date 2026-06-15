import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { changePasswordRequest } from "@/api/adminAuth";
import { ApiError } from "@/api/http";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  currentPassword: z.string().min(1, "Gerekli"),
  newPassword: z.string().min(10, "En az 10 karakter"),
});

type Form = z.infer<typeof schema>;

export function AccountSettingsPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (vals) => {
    try {
      await changePasswordRequest(vals.currentPassword, vals.newPassword);
      navigate("/dashboard");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "İşlem başarısız";
      setFormError("root", { message: msg });
    }
  });

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <Button variant="ghost" asChild className="px-0">
        <Link to="/dashboard">← Panele dön</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Şifre değiştir</CardTitle>
          <CardDescription>Mevcut şifrenizi ve yeni şifrenizi girin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            {errors.root && (
              <p className="text-sm text-red-600">{errors.root.message}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="cur">Mevcut şifre</Label>
              <Input
                id="cur"
                type="password"
                autoComplete="current-password"
                {...register("currentPassword")}
              />
              {errors.currentPassword && (
                <p className="text-xs text-red-600">{errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nw">Yeni şifre</Label>
              <Input
                id="nw"
                type="password"
                autoComplete="new-password"
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p className="text-xs text-red-600">{errors.newPassword.message}</p>
              )}
            </div>
            <Button type="submit">Kaydet</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

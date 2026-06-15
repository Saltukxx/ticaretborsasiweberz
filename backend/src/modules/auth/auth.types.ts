export type AdminRole = "super_admin" | "editor";

export type AccessTokenPayload = {
  sub: string;
  role: AdminRole;
  typ: "access";
};

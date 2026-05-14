export interface PresidentMessage {
  eyebrow: string;
  title: string;
  quote: string[];
  name: string;
  role: string;
  portraitSrc: string;
  portraitAlt: string;
}

export const presidentMessage: PresidentMessage = {
  eyebrow: "Başkanın Mesajı",
  title: "Üretimin emeğini, ticaretin güveniyle buluşturuyoruz.",
  quote: [
    "Erzurum Ticaret Borsası olarak üreticimizin emeğini, tüccarımızın tecrübesini ve bölgemizin ticari potansiyelini daha güçlü bir kurumsal zeminde buluşturmak için çalışıyoruz.",
    "Şeffaf, güvenilir ve çağın gereklerine uygun hizmet anlayışımızla Erzurum'un tarımsal üretimine ve ticari geleceğine değer katmayı sürdüreceğiz.",
  ],
  name: "Yıldırım Hakan ORAL",
  role: "Yönetim Kurulu Başkanı",
  portraitSrc: "/images/baskan-portre.png",
  portraitAlt: "Erzurum Ticaret Borsası Yönetim Kurulu Başkanı Yıldırım Hakan Oral",
};

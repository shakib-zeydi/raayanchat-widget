import { apiRequest } from "./http";

interface RegisterVisitorResponse {
  data: {
    public_id: string;
    token: string;
  };
}

interface RegisterVisitorOptions {
  websiteId: string;
  form: VisitorFormData;
}

export async function registerVisitor({
  websiteId,
  form,
}: RegisterVisitorOptions): Promise<VisitorSession> {
  const result = await apiRequest<RegisterVisitorResponse>(
    `/visitors/${encodeURIComponent(websiteId)}`,
    {
      method: "POST",
      body: {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
      },
    },
  );

  const publicId = result.data?.public_id;
  const token = result.data?.token;

  if (
    typeof publicId !== "string" ||
    !publicId.trim() ||
    typeof token !== "string" ||
    !token.trim()
  ) {
    throw new Error("پاسخ ثبت بازدیدکننده معتبر نیست.");
  }

  return {
    publicId,
    token,
  };
}

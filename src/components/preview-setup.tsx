export default function PreviewSetup() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem", lineHeight: 2 }}>
      <h1>پیش‌نمایش ویجت</h1>
      <p>شناسه عمومی وب‌سایتی را وارد کنید که دامنه آن با آدرس این صفحه مطابقت دارد.</p>
      <form onSubmit={(event) => {
        event.preventDefault();
        const websiteId = new FormData(event.currentTarget).get("websiteId")?.toString().trim();
        if (!websiteId) return;
        const url = new URL(window.location.href);
        url.searchParams.set("website_id", websiteId);
        window.location.assign(url);
      }}>
        <label>شناسه وب‌سایت <input name="websiteId" required dir="ltr" style={{ border: "1px solid #999", borderRadius: "4px", padding: "0.5rem" }} /></label>{" "}
        <button type="submit" style={{ background: "#15803d", color: "white", borderRadius: "4px", padding: "0.5rem 1rem", cursor: "pointer" }}>نمایش ویجت</button>
      </form>
    </main>
  );
}

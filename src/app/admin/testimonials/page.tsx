import TestimonialsList from "@/components/Admin/Testimonials/TestimonialsList";

// Let AdminLayoutClient handle authentication check
// This prevents double-checking and potential race conditions
export default function AdminTestimonialsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý đánh giá</h1>
      </div>
      <TestimonialsList />
    </div>
  );
}

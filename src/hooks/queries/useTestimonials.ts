"use client";

import { useQuery } from "@tanstack/react-query";
import { Testimonial } from "@/types/testimonial";

type TestimonialsResponse = {
  success: boolean;
  data: Testimonial[];
};

const fetchTestimonials = async (): Promise<Testimonial[]> => {
  const response = await fetch("/api/testimonials", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch testimonials");
  }

  const json = (await response.json()) as TestimonialsResponse;
  if (!json.success) {
    throw new Error("Testimonials response returned unsuccessful flag");
  }

  return json.data;
};

export const useTestimonials = () => {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: fetchTestimonials,
  });
};

"use client";

import { useEffect } from"react";
import { useRouter } from"next/navigation";

export default function PaymentsPage() {
 const router = useRouter();

 useEffect(() => {
 router.replace("/dashboard/payments/products");
 }, [router]);

 return null;
}

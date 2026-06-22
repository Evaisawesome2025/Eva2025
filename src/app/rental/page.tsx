import { RentalForm } from "@/components/rental-form";

export default function RentalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rental Analysis</h1>
        <p className="text-muted-foreground">
          BRRRR / buy-and-hold returns — cap rate, cash flow, cash-on-cash & DSCR.
        </p>
      </div>
      <RentalForm />
    </div>
  );
}

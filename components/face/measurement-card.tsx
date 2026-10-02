import type { FaceMeasurement } from "../../lib/face/types";

type Props = {
  measurement: FaceMeasurement;
};

export default function MeasurementCard({
  measurement,
}: Props) {
  const formattedValue =
    measurement.unit === "ratio"
      ? measurement.value.toFixed(2)
      : measurement.value.toFixed(1);

  const suffix =
    measurement.unit === "%"
      ? "%"
      : "";

  return (
    <div className="rounded-2xl border border-[#dce5fa] bg-white p-5 transition hover:border-[#c5d4f5] hover:shadow-[0_10px_35px_#183c7310]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-medium text-[#080e2b]">
            {measurement.label}
          </h3>

          {measurement.description && (
            <p className="mt-1.5 text-xs leading-5 text-[#7a87aa]">
              {measurement.description}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <span className="text-2xl font-medium tracking-tight text-[#4773ec]">
            {formattedValue}
            {suffix}
          </span>

          {measurement.unit === "ratio" && (
            <span className="ml-1 text-xs text-[#a4b5d8]">
              ratio
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
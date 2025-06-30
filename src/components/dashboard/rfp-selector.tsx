
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { type RFP } from '@/lib/rfp.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type RfpSelectorProps = {
  rfps: RFP[];
  selectedRfpId: string;
};

export function RfpSelector({ rfps, selectedRfpId }: RfpSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSelectRfp = (rfpId: string) => {
    // We only need to push the new rfpId, keeping other query params would be complex
    // and is not required for this feature.
    router.push(`${pathname}?rfpId=${rfpId}`);
  };

  return (
    <div className="mb-6">
      <Select value={selectedRfpId} onValueChange={handleSelectRfp}>
        <SelectTrigger className="w-full md:w-auto md:min-w-[320px] text-lg font-semibold h-12">
          <SelectValue placeholder="Select an RFP" />
        </SelectTrigger>
        <SelectContent>
          {rfps.map((rfp) => (
            <SelectItem key={rfp.id} value={rfp.id}>
              {rfp.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

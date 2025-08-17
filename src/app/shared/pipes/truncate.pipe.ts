import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true,
  pure: true,
})
export class TruncatePipe implements PipeTransform {
  transform(value: unknown, max = 14, appendEllipsis = false): string {
    if (value == null) return '';
    const str = String(value);
    if (max <= 0) return '';
    if (str.length <= max) return str;
    return appendEllipsis && max > 3 ? str.slice(0, max - 3) + '...' : str.slice(0, max);
  }
}

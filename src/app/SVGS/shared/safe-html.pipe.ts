import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'safeHtml',
  standalone: false
})
export class SafeHtmlPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}

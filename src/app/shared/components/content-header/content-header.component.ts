import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-content-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './content-header.component.html',
  styleUrls: ['./content-header.component.scss']
})
export class ContentHeaderComponent {
  @Input() title: string = 'Page Title';
  @Input() showBackButton: boolean = false;

  @Output() backClicked = new EventEmitter<void>();

  onBackClick(): void {
    this.backClicked.emit();
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-external-provider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './external-provider.html',
  styleUrl: './external-provider.scss'
})
export class ExternalProviderComponent { }

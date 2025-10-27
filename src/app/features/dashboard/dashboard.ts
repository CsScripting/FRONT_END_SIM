import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EnvironmentService } from '../../core/services/environment.service';
import { UserEnvironment } from '../../core/models/environment.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  environments$!: Observable<UserEnvironment[]>;

  constructor(private environmentService: EnvironmentService) { }

  ngOnInit(): void {
    this.environments$ = this.environmentService.getUserEnvironments().pipe(
      map(response => response.environments)
    );
  }

  onSelectEnvironment(env: UserEnvironment): void {
    // NOTE: Logic to handle environment selection will be added later
    console.log('Selected environment:', env);
  }
}

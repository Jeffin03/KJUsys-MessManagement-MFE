import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-4 gap-4">
      <div (click)="navigate.emit('student-search')" class="flex flex-col rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-4 pt-[22px] pb-[39px] h-[127px] box-border cursor-pointer hover:shadow-md transition-shadow">
        <div class="flex items-center gap-2 mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span class="text-xs font-medium text-[#6B7280]">Student Explorer</span>
        </div>
        <span class="text-sm font-semibold text-[#111827]">Search and view student reports</span>
      </div>

      <div (click)="navigate.emit('analytics')" class="flex flex-col rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-4 pt-[22px] pb-[39px] h-[127px] box-border cursor-pointer hover:shadow-md transition-shadow">
        <div class="flex items-center gap-2 mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span class="text-xs font-medium text-[#6B7280]">Analytics Dashboard</span>
        </div>
        <span class="text-sm font-semibold text-[#111827]">Daily meal volumes and trends</span>
      </div>

      <div (click)="navigate.emit('audit')" class="flex flex-col rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-4 pt-[22px] pb-[39px] h-[127px] box-border cursor-pointer hover:shadow-md transition-shadow">
        <div class="flex items-center gap-2 mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span class="text-xs font-medium text-[#6B7280]">Audit Tools</span>
        </div>
        <span class="text-sm font-semibold text-[#111827]">Pause audits and change logs</span>
      </div>

      <div (click)="navigate.emit('holidays')" class="flex flex-col rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-4 pt-[22px] pb-[39px] h-[127px] box-border cursor-pointer hover:shadow-md transition-shadow">
        <div class="flex items-center gap-2 mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span class="text-xs font-medium text-[#6B7280]">Holiday Calendar</span>
        </div>
        <span class="text-sm font-semibold text-[#111827]">Manage mess closure dates</span>
      </div>
    </div>
  `
})
export class ReportsLandingComponent {
  @Output() navigate = new EventEmitter<string>();
}

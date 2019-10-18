import { Component, Input, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';

import { statDataNameType } from '~/core/types/stat/statDataNameType';
import { DestroyObservable } from '~/core/components/destroy-observable';

import { StatService } from '../../../../services/stat.service';

@Component({
  selector: 'app-stat-graph-view',
  templateUrl: './stat-graph-view.component.html',
  styleUrls: ['./stat-graph-view.component.scss'],
})
export class StatGraphViewComponent extends DestroyObservable implements OnInit {
  @Input() graphName: statDataNameType;

  constructor(public statService: StatService) {
    super();
  }

  ngOnInit() {
    this.loadStat();
  }

  get loading(): boolean {
    return this.statService.loading;
  }

  get loaded(): boolean {
    return this.statService.loaded;
  }

  private loadStat(): void {
    if (this.statService.loading) {
      return;
    }
    this.statService.loadOne().subscribe();
  }
}

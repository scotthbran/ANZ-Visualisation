import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {DataManagerService} from '../../services/data-manager.service';
import * as d3 from 'd3/dist/d3.min.js';

@Component({
  selector: 'app-bubble-vis',
  templateUrl: './bubble-vis.component.html',
  styleUrls: ['./bubble-vis.component.css']
})

export class BubbleVisComponent implements OnInit {

  private svg: any;
  private data: any;
  private teamsFilter = [];

  auSelect = true;
  nzSelect = true;

  private ratios = {
    homeRatio: (team) => {
      return {
        title: 'Home Wins Ratio',
        ratio: this.dataManager.roundRatio(team.homeWins / team.homeGames)
      };
    },
    awayRatio: (team) => {
      return {
        title: 'Away Wins Ratio',
        ratio: this.dataManager.roundRatio(team.awayWins / team.awayGames)
      };
    },
    winsRatio: (team) => {
      return {
        title: 'Wins Ratio',
        ratio: this.dataManager.roundRatio((team.homeWins + team.awayWins) / (team.homeGames + team.awayGames))
      };
    },
    interCountryRatio: (team) => {
      return {
        title: 'Inter Country Wins Ratio',
        ratio: this.dataManager.roundRatio(team.interCountryWins / team.interCountryGames)
      };
    }
  };

  private targetRatio = this.ratios.homeRatio;

  constructor(private container: ElementRef, private dataManager: DataManagerService) {
  }

  ngOnInit() {
    this.svg = d3.select(this.container.nativeElement).select('svg').attr('class', 'bubble');
    this.setupDataCallback();
    this.drawSvg();
  }

  setupDataCallback() {
    this.dataManager.addCallback((result) => {
      if (this.teamsFilter.length !== 0) {
        this.teamsFilter.forEach((item) => result.delete(item.teamName));
      }
      this.data = {children: Array.from(result.values())};
      this.drawSvg();
    });
  }

  changeTargetRatio(ratio) {
    this.targetRatio = ratio;
    this.drawSvg();
  }

  private drawSvg() {
    this.svg.selectAll('*').remove();
    if (this.data.children.length === 0) {
      return;
    }
    const diameter = 300;
    const bubble = d3.pack(this.data)
      .size([diameter, diameter])
      .padding(1.5);
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const nodes = d3.hierarchy(this.data)
      .sum((d) => {
        return this.targetRatio(d).ratio;
      });

    const node = this.svg.selectAll('.node')
      .data(bubble(nodes).descendants())
      .enter()
      .filter((d) => {
        return !d.children;
      })
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => {
        return `translate(${d.x}, ${d.y})`;
      });

    node.append('circle')
      .attr('r', (d) => {
        return d.r;
      })
      .style('fill', (d, i) => {
        return this.dataManager.teamColor(d.data.teamName);
      });

    node.append('text')
      .attr('dy', '.2em')
      .style('text-anchor', 'middle')
      .text((d) => {
        return d.data.teamName;
      })
      .attr('font-family', 'sans-serif')
      .attr('font-size', (d) => {
        return d.r / 7;
      })
      .attr('fill', 'white');

    node.append('text')
      .attr('dy', '1.3em')
      .style('text-anchor', 'middle')
      .text((d) => {
        return this.targetRatio(d.data).title + ' ' + this.targetRatio(d.data).ratio;
      })
      .attr('font-family', 'sans-serif')
      .attr('font-size', (d) => {
        return d.r / 7;
      })
      .attr('fill', 'white');
  }

  /**
   * Removes or Adds a team from team filter depending if team is in team filter
   */
  selectTeam(team: any) {
    if (this.teamsFilter.includes(team)) {
      this.teamsFilter = this.teamsFilter.filter((item) => item !== team);
    } else {
      this.teamsFilter.push(team);
    }
    this.dataManager.updateCallbacks();
  }

  /**
   * Selects all teams from country depending on global nzSelect or auSelect state
   */
  selectAll() {
    this.teamsFilter = this.teamsFilter.filter((item) => item.country !== 'New Zealand');
    this.teamsFilter = this.teamsFilter.filter((item) => item.country !== 'Australia');
    if (!this.nzSelect) {
      this.dataManager.getTeamInfo().filter((item => item.country === 'New Zealand')).forEach((item) => this.teamsFilter.push(item));
    }
    if (!this.auSelect) {
      this.dataManager.getTeamInfo().filter((item => item.country === 'Australia')).forEach((item) => this.teamsFilter.push(item))
    }
    this.dataManager.updateCallbacks();
  }
}

import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth-config/auth.service';
import { Work } from './models/work.model';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { WorkHistoryService } from './services/work-history.service';
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-work-history',
  templateUrl: './work-history.component.html',
  styleUrls: ['./work-history.component.css']
})
export class WorkHistoryComponent implements OnInit {
  workHistory: Work[] = [];
  filteredWorkHistory: Work[] = [];
  sortBy: 'state' | 'startDate' | 'endDate' | 'duration' | 'none' = 'none';
  sortDirection: 'asc' | 'desc' = 'asc';
  startDate: string = '';
  endDate: string = '';
  totalDuration: string = '';
  searchPerformed: boolean = false;

  constructor(private workHistoryService: WorkHistoryService, private authService: AuthService) {}

  ngOnInit() {
    this.workHistoryService.getWorkHistory().subscribe((works) => {
      this.workHistory = works;
      this.filterLast7DaysWork();
    });
  }

  filterLast7DaysWork() {
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
  
    console.log('Today :', today);
    console.log('Last 7 Days ', last7Days);
    console.log('Work History:', this.workHistory);
    
    this.filteredWorkHistory = this.workHistory.filter(work => {
      const workDate = new Date(work.startDate);
      workDate.setHours(parseInt(work.startHour.split(':')[0]));
      workDate.setMinutes(parseInt(work.startHour.split(':')[1]));
      workDate.setSeconds(parseInt(work.startHour.split(':')[2]));
      return workDate && workDate >= last7Days && workDate <= today;
    });
    console.log(this.filteredWorkHistory)
  
    this.sortWorkHistory();
    this.totalDuration = this.calculateTotalDuration(this.filteredWorkHistory);
  }
  
  


  sortWorkHistory() {
    if (this.sortBy === 'none') {
      this.workHistory.sort((a, b) => {
        const dateA = this.parseDateTime(`${a.startDate} ${a.startHour}`);
        const dateB = this.parseDateTime(`${b.startDate} ${b.startHour}`);
        if (dateA && dateB) {
          return dateA.getTime() - dateB.getTime();
        }
        return 0;
      });
    } else {
      this.workHistory.sort((a, b) => {
        if (this.sortBy === 'state') {
          if (this.sortDirection === 'asc') {
            return a.stage.localeCompare(b.stage);
          } else {
            return b.stage.localeCompare(a.stage);
          }
        } else if (this.sortBy === 'startDate' || this.sortBy === 'endDate') {
          const dateA = this.parseDateTime(`${a[this.sortBy]} ${a.startHour}`);
          const dateB = this.parseDateTime(`${b[this.sortBy]} ${b.startHour}`);
          if (dateA && dateB) {
            if (this.sortDirection === 'asc') {
              return dateA.getTime() - dateB.getTime();
            } else {
              return dateB.getTime() - dateA.getTime();
            }
          }
        } else if (this.sortBy === 'duration') {
          const durationA = this.calculateDurationInMinutes(a);
          const durationB = this.calculateDurationInMinutes(b);

          if (this.sortDirection === 'asc') {
            return (durationA !== null ? durationA : Number.MAX_SAFE_INTEGER) - (durationB !== null ? durationB : Number.MAX_SAFE_INTEGER);
          } else {
            return (durationB !== null ? durationB : Number.MAX_SAFE_INTEGER) - (durationA !== null ? durationA : Number.MAX_SAFE_INTEGER);
          }
        }
        return 0;
      });
    }
  }

  calculateDurationInMinutes(work: Work): number | null {
    if (!work.startHour || !work.endHour) {
      return null;
    }

    const startDate = this.parseDateTime(`${work.startDate} ${work.startHour}`);
    const endDate = this.parseDateTime(`${work.endDate} ${work.endHour}`);

    if (startDate && endDate) {
      const timeDifference = endDate.getTime() - startDate.getTime();
      const minutes = timeDifference / (1000 * 60);
      return minutes;
    } else {
      return null;
    }
  }

  formatWorkDate(dateString: string): string {
    if (dateString === null) { return ''; }
    const date = new Date(dateString);
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    return formattedDate;
  }

  logout() {
    this.authService.removeToken();
  }

  parseDateTime(dateTimeStr: string): Date | null {
    const dateTimeParts = dateTimeStr.split(' ');
    const dateParts = dateTimeParts[0].split('-');
    const timeParts = dateTimeParts[1].split(':');

    if (dateParts.length === 3 && timeParts.length === 3) {
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1;
      const day = parseInt(dateParts[2]);
      const hours = parseInt(timeParts[0]);
      const minutes = parseInt(timeParts[1]);
      const seconds = parseInt(timeParts[2]);

      return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    }
    return null;
  }

  calculateDuration(work: Work): string {
    if (!work.startHour) {
      return 'Brak godziny rozpoczęcia';
    }

    if (!work.endHour) {
      return 'Praca w toku';
    }

    const startDate = this.parseDateTime(`${work.startDate} ${work.startHour}`);
    const endDate = this.parseDateTime(`${work.endDate} ${work.endHour}`);

    if (startDate && endDate) {
      const timeDifference = endDate.getTime() - startDate.getTime();

      const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

      if (days > 0) {
        return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    } else {
      return 'Nieprawidłowa data lub godzina';
    }
  }

  searchWorkHistory() {
    if (!this.searchPerformed) {
      this.searchPerformed = true;
    }
    this.filteredWorkHistory = this.workHistory.filter(work => {
      const workDate = this.parseDateTime(`${work.startDate} ${work.startHour}`);
      return workDate && workDate >= new Date(this.startDate) && workDate <= new Date(this.endDate);
    });

    this.sortWorkHistory();

    this.totalDuration = this.calculateTotalDuration(this.filteredWorkHistory);
  }

  calculateTotalDuration(workItems: Work[]): string {
    let totalMilliseconds = 0;

    workItems.forEach(work => {
      const startDate = this.parseDateTime(`${work.startDate} ${work.startHour}`);
      const endDate = this.parseDateTime(`${work.endDate} ${work.endHour}`);

      if (startDate && endDate) {
        const durationMilliseconds = endDate.getTime() - startDate.getTime();
        totalMilliseconds += durationMilliseconds;
      }
    });
    const totalSeconds = totalMilliseconds / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  calculateDurationPdf(work: Work): string {
    if (!work.startHour) {
      return 'Brak godziny rozpoczęcia';
    }

    if (!work.endHour) {
      return 'Praca w toku';
    }

    const startDate = this.parseDateTime(`${work.startDate} ${work.startHour}`);
    const endDate = this.parseDateTime(`${work.endDate} ${work.endHour}`);

    if (startDate && endDate) {
      const timeDifference = endDate.getTime() - startDate.getTime();

      const hours = Math.floor(timeDifference / (1000 * 60 * 60));
      const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

      return `${hours}h ${minutes}m`;
    } else {
      return 'Nieprawidłowa data lub godzina';
    }
  }

  downloadWorkHistory() {
    this.workHistoryService.getAccountDetails().subscribe(
      (userData) => {

        const userEmail = userData.userEmail;
        const userSurname = userData.surname;
        const userName = userData.name;
        const position = userData.position;

        const totalDuration = this.calculateTotalDuration(this.filteredWorkHistory);

        const docDefinition: TDocumentDefinitions = {
          content: [
            'Historia pracy',
            `Email: ${userEmail}`,
            `Imie: ${userName}`,
            `Nazwisko: ${userSurname}`,
            `Stanowisko: ${position}`,
            {
              table: {
                body: [
                  ['Stan', 'Data rozpoczęcia', 'Godzina rozpoczęcia', 'Data zakończenia', 'Godzina zakończenia', 'Czas trwania'],
                  ...this.filteredWorkHistory.map(work => [
                    work.stage,
                    this.formatWorkDate(work.startDate),
                    work.startHour,
                    this.formatWorkDate(work.endDate),
                    work.endHour,
                    this.calculateDurationPdf(work)
                  ]),
                ],
              },
            },
            {
              text: `Ilość godzin przepracowanych w danym okresie: ${totalDuration}`,
              alignment: 'right',
              margin: [0, 10, 0, 0],
            },
          ],
        };
        const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        const fileName = `work_history_${userName}_${userSurname}.pdf`;
        pdfDocGenerator.download(fileName);
      },
      (error) => {
        // Obsługa błędu
      }
    );
  }
}

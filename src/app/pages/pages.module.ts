import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PagesRoutingModule } from './pages-routing.module';
import { TopbarComponent } from './components/topbar/topbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CardsComponent } from './components/cards/cards.component';
import { ActivityComponent } from './components/activity/activity.component';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProjectbuildingComponent } from './projectbuilding/projectbuilding.component';
import * as fabric from 'fabric';
import { CreateprojectComponent } from './createproject/createproject.component';
import { PresentationComponent } from './presentation/presentation.component';
import { CoverletterComponent } from './coverletter/coverletter.component';
import { ArchiveComponent } from './archive/archive.component';
import { ClientsComponent } from './clients/clients.component';
import { AllUsersComponent } from './allusers/allusers.component';
import { ProductsComponent } from './products/products.component';
import { ApprovaldocumentsComponent } from './approvaldocuments/approvaldocuments.component';
// import { UsersComponent } from './users/users.component';
import { ReactiveFormsModule } from '@angular/forms';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ArchiveProjectComponent } from './archiveprojects/archiveprojects.component';
import { FootComponent } from './components/foot/foot.component';
import { SliderComponent } from './components/slider/slider.component';
import { RouterModule } from '@angular/router';
import { SvgIconsComponent } from "../shared/svg-icons/svg-icons.component";
@NgModule({
  declarations: [
    
    ActivityComponent,
    DashboardComponent,
 

    ArchiveComponent,
   

  ],
  imports: [
    CoverletterComponent,

    CommonModule,
    PagesRoutingModule,
    ArchiveProjectComponent,
    CreateprojectComponent,
    ProjectbuildingComponent,
    PresentationComponent,
    AllUsersComponent,
    ProductsComponent,
    TopbarComponent,
    FootComponent,
    ApprovaldocumentsComponent,
    SliderComponent,
    ReactiveFormsModule,
    ProjectListComponent,
    FontAwesomeModule,
    SidebarComponent,
    FormsModule,
    RouterModule,
    CardsComponent,
    SvgIconsComponent
],
exports: [TopbarComponent]
})
export class PagesModule { }

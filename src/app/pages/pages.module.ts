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
import { UpdateStep1Component } from './update-step1/update-step1.component';
import { UpdateStep2Component } from './update-step2/update-step2.component';
import { UpdateStep3Component } from './update-step3/update-step3.component';
import { UpdateStep4Component } from './update-step4/update-step4.component';
import { UpdateStep5Component } from './update-step5/update-step5.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ImageEditorComponent } from './image-editor/image-editor.component';
import { ImageModalComponent } from './components/imagemodal/imagemodal.component';

@NgModule({
  declarations: [
    
    ActivityComponent,
    DashboardComponent,
    ArchiveComponent,
    
        
   

  ],
  imports: [
    UpdateStep1Component,
    ImageEditorComponent,
    ImageModalComponent,

    UpdateStep2Component,
    UpdateStep4Component,
    NavbarComponent,
    UpdateStep3Component,
    UpdateStep5Component,
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

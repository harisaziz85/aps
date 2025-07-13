import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SvgIconsComponent } from '../../shared/svg-icons/svg-icons.component';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-coverletter',
  templateUrl: './coverletter.component.html',
  styleUrls: ['./coverletter.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    SvgIconsComponent
  ],
  standalone: true
})
export class CoverletterComponent implements OnInit {
  coverLetterForm: FormGroup;
  selectedFile: File | null = null;
  isDragging = false;
  alertMessage: string = '';
  alertType: 'success' | 'danger' = 'success';
  showAlert: boolean = false;
  returnTo: string | null = null;
  projectId: string | null = null;
  instanceId: string | null = null;
  from: string | null = null;
  projectImagePreview: string | null = null;
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.coverLetterForm = this.fb.group({
      projectName: ['', Validators.required],
      clientName: ['', Validators.required],
      address: ['', Validators.required],
      date: ['', Validators.required],
      buildingName: ['', Validators.required],
      reportTitle: ['', Validators.required],
      additionalInfo: [''],
      totalItems: ['', [Validators.required, Validators.min(0)]],
      passedItems: ['', [Validators.required, Validators.min(0)]],
      failedItems: ['', [Validators.required, Validators.min(0)]],
      tbcItems: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.document.documentElement.scrollTop = 0;
    this.document.body.scrollTop = 0;

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.document.documentElement.scrollTop = 0;
        this.document.body.scrollTop = 0;
      }
    });

    this.route.queryParams.subscribe(params => {
      this.returnTo = params['returnTo'] || null;
      this.projectId = params['projectId'] || localStorage.getItem('projectId') || null;
      this.instanceId = params['instanceId'] || localStorage.getItem('instanceId') || null;
      this.from = params['from'] || null;

      if (this.projectId) {
        localStorage.setItem('projectId', this.projectId);
      }
      if (this.instanceId) {
        localStorage.setItem('instanceId', this.instanceId);
      } else {
        console.warn('instanceId not found in query params or localStorage');
      }

      if (this.projectId) {
        this.fetchProjectData(this.projectId);
      } else {
        this.showAlertMessage('Project ID not found. Please provide a valid project ID.', 'danger');
      }
    });
  }

  fetchProjectData(projectId: string) {
    this.http.get(`https://vps.allpassiveservices.com.au/api/project-instance/${projectId}/compliance-stats`)
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            const { complianceStats, projectInfo } = response.data;
            const formattedAddress = [
              projectInfo.address?.line1,
              projectInfo.address?.line2,
              projectInfo.address?.city,
              projectInfo.address?.state,
              projectInfo.address?.zip
            ].filter(Boolean).join(', ');
            const formattedDate = projectInfo.createdAt ? new Date(projectInfo.createdAt).toISOString().split('T')[0] : '';

            this.projectImagePreview = projectInfo.imageUrl || null;

            this.coverLetterForm.patchValue({
              projectName: projectInfo.projectName || '',
              clientName: projectInfo.clientName || '',
              address: formattedAddress || '',
              date: formattedDate || '',
              buildingName: projectInfo.buildingName || '',
              reportTitle: '',
              additionalInfo: '',
              totalItems: complianceStats.total || 0,
              passedItems: complianceStats.passed || 0,
              failedItems: complianceStats.failed || 0,
              tbcItems: 0
            });
          } else {
            this.showAlertMessage('No data found for the project.', 'danger');
          }
        },
        error: (error) => {
          console.error('Error fetching project data:', error);
          this.showAlertMessage('Error fetching project data. Please try again.', 'danger');
        }
      });
  }

  showAlertMessage(message: string, type: 'success' | 'danger') {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile && this.selectedFile.type.startsWith('image/')) {
      this.projectImagePreview = URL.createObjectURL(this.selectedFile);
    } else {
      this.projectImagePreview = null;
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      if (this.selectedFile && this.selectedFile.type.startsWith('image/')) {
        this.projectImagePreview = URL.createObjectURL(this.selectedFile);
      } else {
        this.projectImagePreview = null;
      }
    }
  }

  async onSubmit() {
    if (this.coverLetterForm.valid) {
      this.isSubmitting = true;
      const formData = new FormData();
      const storedProjectId = localStorage.getItem('projectId') || this.projectId || '';
      const storedInstanceId = localStorage.getItem('instanceId') || this.instanceId || '';

      Object.keys(this.coverLetterForm.value).forEach(key => {
        formData.append(key, this.coverLetterForm.value[key]);
      });

      formData.append('projectId', storedProjectId);
      if (storedInstanceId) {
        formData.append('instanceId', storedInstanceId);
      }

      try {
        let coverLetterFile: File | null = this.selectedFile;
        if (!this.selectedFile && this.projectImagePreview) {
          const response = await this.http.get(this.projectImagePreview, { responseType: 'blob' }).toPromise();
          if (response) {
            const fileName = this.projectImagePreview.split('/').pop() || 'database-image.png';
            coverLetterFile = new File([response], fileName, { type: response.type || 'image/png' });
          }
        }

        if (coverLetterFile) {
          formData.append('coverLetter', coverLetterFile);
        }

        formData.append('reportPDF', '');

        this.http.post('https://vps.allpassiveservices.com.au/api/project/uploadCoverLetter', formData)
          .subscribe({
            next: (response: any) => {
              if (response.reportId) {
                localStorage.setItem('reportId', response.reportId);
              }
              if (response.instanceId) {
                localStorage.setItem('instanceId', response.instanceId);
              }
              this.showAlertMessage('Cover letter uploaded successfully!', 'success');

              setTimeout(() => {
                this.isSubmitting = false;
                this.document.documentElement.scrollTop = 0;
                this.document.body.scrollTop = 0;

                const queryParams = {
                  from: 'coverletter',
                  reportId: response.reportId || '',
                  instanceId: storedInstanceId || response.instanceId || '',
                  openModal: 'true'
                };

                if (!this.projectId) {
                  this.showAlertMessage('Project ID is missing. Cannot navigate back.', 'danger');
                  this.isSubmitting = false;
                  return;
                }

                if (this.returnTo === 'updateproject5') {
                  this.router.navigate([`/pages/updateproject5/${this.projectId}`], {
                    queryParams
                  }).then(() => {
                    this.document.documentElement.scrollTop = 0;
                    this.document.body.scrollTop = 0;
                  }).catch(err => console.error('Navigation Error:', err));
                } else if (this.returnTo === 'presentation') {
                  this.router.navigate([`/pages/presentation/${this.projectId}`], {
                    queryParams
                  }).then(() => {
                    this.document.documentElement.scrollTop = 0;
                    this.document.body.scrollTop = 0;
                  }).catch(err => console.error('Navigation Error:', err));
                } else {
                  this.showAlertMessage('Invalid return route. Please navigate back manually.', 'danger');
                  this.isSubmitting = false;
                }
              }, 2000);
            },
            error: (error) => {
              console.error('Upload Failed:', error);
              this.isSubmitting = false;
              let errorMessage = 'Upload failed. ';
              if (error.error?.error) {
                errorMessage += error.error.error;
              } else if (error.error?.message) {
                errorMessage += error.error.message;
              } else {
                errorMessage += 'Please try again.';
              }
              this.showAlertMessage(errorMessage, 'danger');
            }
          });
      } catch (error) {
        console.error('Error fetching database image:', error);
        this.isSubmitting = false;
        this.showAlertMessage('Failed to fetch database image. Please try again.', 'danger');
      }
    } else {
      this.isSubmitting = false;
      this.showAlertMessage('Please fill in all required fields.', 'danger');
    }
  }
}
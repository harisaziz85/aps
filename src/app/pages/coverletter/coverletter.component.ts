import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterModule, NavigationEnd } from '@angular/router';
import { PresentationService } from '../../core/services/presentation.service';
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
    private presentationService: PresentationService,
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
    // Reset scroll position when component initializes
    this.document.documentElement.scrollTop = 0;
    this.document.body.scrollTop = 0;

    // Subscribe to router events to handle scroll on navigation
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
      console.log('Query Params:', { returnTo: this.returnTo, projectId: this.projectId, instanceId: this.instanceId, from: this.from });

      // Save projectId and instanceId to localStorage
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
          console.log('API Response:', response);
          if (response.success && response.data) {
            const { complianceStats, projectInfo } = response.data;

            // Format address from API response
            const formattedAddress = [
              projectInfo.address?.line1,
              projectInfo.address?.line2,
              projectInfo.address?.city,
              projectInfo.address?.state,
              projectInfo.address?.zip
            ].filter(Boolean).join(', ');

            // Format date from API response
            const formattedDate = projectInfo.createdAt ? new Date(projectInfo.createdAt).toISOString().split('T')[0] : '';

            // Set project image preview
            this.projectImagePreview = projectInfo.imageUrl || null;
            console.log('Project Image Preview from API:', this.projectImagePreview);

            // Patch form with API data
            this.coverLetterForm.patchValue({
              projectName: projectInfo.projectName || '',
              clientName: projectInfo.clientName || '',
              address: formattedAddress || '',
              date: formattedDate || '',
              buildingName: projectInfo.buildingName || '',
              reportTitle: '', // Not provided in API, so leave empty
              additionalInfo: '', // Not provided in API, so leave empty
              totalItems: complianceStats.total || 0,
              passedItems: complianceStats.passed || 0,
              failedItems: complianceStats.failed || 0,
              tbcItems: 0 // Not provided in API, default to 0
            });

            console.log('Form Patched Values:', {
              projectName: projectInfo.projectName,
              clientName: projectInfo.clientName,
              address: formattedAddress,
              date: formattedDate,
              buildingName: projectInfo.buildingName,
              reportTitle: '',
              additionalInfo: '',
              totalItems: complianceStats.total,
              passedItems: complianceStats.passed,
              failedItems: complianceStats.failed,
              tbcItems: 0,
              imageUrl: projectInfo.imageUrl
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
    console.log('Selected File:', this.selectedFile?.name);
    if (this.selectedFile && this.selectedFile.type.startsWith('image/')) {
      this.projectImagePreview = URL.createObjectURL(this.selectedFile);
    } else {
      this.projectImagePreview = null;
    }
    console.log('Project Image Preview:', this.projectImagePreview);
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
      console.log('Dropped File:', this.selectedFile?.name);
      if (this.selectedFile && this.selectedFile.type.startsWith('image/')) {
        this.projectImagePreview = URL.createObjectURL(this.selectedFile);
      } else {
        this.projectImagePreview = null;
      }
      console.log('Project Image Preview:', this.projectImagePreview);
    }
  }

  async onSubmit() {
    console.log('Form Submitted. Form Valid:', this.coverLetterForm.valid);
    if (this.coverLetterForm.valid) {
      this.isSubmitting = true;
      const formData = new FormData();
      const storedProjectId = localStorage.getItem('projectId') || this.projectId || '';
      const storedInstanceId = localStorage.getItem('instanceId') || this.instanceId || '';

      // Append form data
      Object.keys(this.coverLetterForm.value).forEach(key => {
        formData.append(key, this.coverLetterForm.value[key]);
        console.log(`FormData - ${key}:`, this.coverLetterForm.value[key]);
      });

      formData.append('projectId', storedProjectId);
      if (storedInstanceId) {
        formData.append('instanceId', storedInstanceId);
        console.log('FormData - instanceId:', storedInstanceId);
      }
      console.log('FormData - projectId:', storedProjectId);

      try {
        let coverLetterFile: File | null = this.selectedFile;
        if (!this.selectedFile && this.projectImagePreview) {
          const response = await this.http.get(this.projectImagePreview, { responseType: 'blob' }).toPromise();
          if (response) {
            const fileName = this.projectImagePreview.split('/').pop() || 'database-image.png';
            coverLetterFile = new File([response], fileName, { type: response.type || 'image/png' });
            console.log('Fetched Database Image as File:', coverLetterFile.name);
          } else {
            throw new Error('No response received for database image');
          }
        }

        if (coverLetterFile) {
          formData.append('coverLetter', coverLetterFile);
        }

        formData.append('reportPDF', '');

        // Debug: Log the complete formData
        for (let pair of (formData as any).entries()) {
          console.log('FormData Entry:', pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
        }

        this.http.post('https://vps.allpassiveservices.com.au/api/project/uploadCoverLetter', formData)
          .subscribe({
            next: (response: any) => {
              console.log('Upload Successful:', response);
              if (response.reportId) {
                localStorage.setItem('reportId', response.reportId);
              }
              if (response.instanceId) {
                localStorage.setItem('instanceId', response.instanceId);
                console.log('Updated instanceId in localStorage:', response.instanceId);
              }
              this.showAlertMessage('Cover letter uploaded successfully!', 'success');

              setTimeout(() => {
                this.isSubmitting = false;
                // Reset scroll position before navigating
                this.document.documentElement.scrollTop = 0;
                this.document.body.scrollTop = 0;

                if (this.returnTo === 'presentation' && this.projectId) {
                  console.log('Navigating to /pages/presentation with projectId:', this.projectId, 'instanceId:', storedInstanceId);
                  this.router.navigate([`/pages/presentation/${this.projectId}`], {
                    queryParams: {
                      from: 'coverletter',
                      reportId: response.reportId,
                      instanceId: storedInstanceId || response.instanceId || ''
                    }
                  }).then(() => {
                    // Ensure scroll to top after navigation
                    this.document.documentElement.scrollTop = 0;
                    this.document.body.scrollTop = 0;
                  }).catch(err => console.error('Navigation Error:', err));
                } else if (this.returnTo === 'reports') {
                  console.log('Navigating to /pages/create-project with reports tab');
                  this.router.navigate(['/pages/create-project'], {
                    queryParams: {
                      tab: 'reports',
                      drawer: 'open'
                    }
                  }).then(() => {
                    this.document.documentElement.scrollTop = 0;
                    this.document.body.scrollTop = 0;
                  }).catch(err => console.error('Navigation Error:', err));
                } else {
                  console.log('Navigating to default /pages/create-project');
                  this.router.navigate(['/pages/create-project']).then(() => {
                    this.document.documentElement.scrollTop = 0;
                    this.document.body.scrollTop = 0;
                  }).catch(err => console.error('Navigation Error:', err));
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
      console.log('Form Invalid');
    }
  }
}
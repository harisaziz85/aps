import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FootComponent } from '../components/foot/foot.component';
import { TopbarComponent } from '../components/topbar/topbar.component';
import { SvgIconsComponent } from '../../shared/svg-icons/svg-icons.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-allusers',
  templateUrl: './allusers.component.html',
  styleUrls: ['./allusers.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, FootComponent, TopbarComponent, SvgIconsComponent],
})
export class AllUsersComponent implements OnInit {
  faPlus = faPlus;
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  selectedUserType: string = '';
  isDropdownOpen: boolean = false;
  activeTab: string = 'tab1';
  userType: string = 'mobile user';
  name: string = '';
  email: string = '';
  phone: string = '';
  employeeId: string = '';
  username: string = '';
  password: string = '';
  profilePic: File | null = null;
  profilePicPreview: string | null = null;
  showPassword: boolean[] = [];
  isLoading: boolean = false;
  errors: { [key: string]: string } = {};
  backendError: string = '';
  userIdToDelete: string | undefined = undefined;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(private userService: UserService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users.map((user) => ({
          ...user,
          profilePic: user.profilePic || '',
        }));
        this.filteredUsers = this.users;
        this.showPassword = new Array(users.length).fill(false);
        this.isLoading = false;
        this.toastr.success('Users loaded successfully', 'Success');
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
        this.toastr.error('Failed to load users. Please try again.', 'Error');
      },
    });
  }

  getAsterisks(length: number): string {
    return '*'.repeat(length);
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter((user) => {
      const matchesSearch =
        (user.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) || '') ||
        (user.username?.toLowerCase().includes(this.searchTerm.toLowerCase()) || '') ||
        (user.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) || '');
      const matchesUserType = this.selectedUserType
        ? user.userType.toLowerCase() === this.selectedUserType.toLowerCase()
        : true;
      return matchesSearch && matchesUserType;
    });
    this.showPassword = new Array(this.filteredUsers.length).fill(false);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  setUserType(type: string): void {
    this.userType = type;
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.profilePic = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profilePicPreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.profilePic);
    }
  }

  validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    if (!this.name.trim()) {
      this.errors['name'] = 'Name is required.';
      isValid = false;
    }
    if (!this.username.trim()) {
      this.errors['username'] = 'Username is required.';
      isValid = false;
    }
    if (!this.password.trim()) {
      this.errors['password'] = 'Password is required.';
      isValid = false;
    }
    if (!this.email.trim()) {
      this.errors['email'] = 'Email is required.';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.errors['email'] = 'Invalid email format.';
      isValid = false;
    }
    if (!this.phone.trim()) {
      this.errors['phone'] = 'Phone number is required.';
      isValid = false;
    } else if (!/^\+?\d{10,}$/.test(this.phone)) {
      this.errors['phone'] = 'Invalid phone number format.';
      isValid = false;
    }
    if (!this.employeeId.trim()) {
      this.errors['employeeId'] = 'Employee ID is required.';
      isValid = false;
    }
    if (!this.userType) {
      this.errors['userType'] = 'User type is required.';
      isValid = false;
    }

    if (!isValid) {
      this.toastr.error('Please fill all required fields correctly', 'Form Invalid');
    }

    return isValid;
  }

  createUser(): void {
    if (!this.validateForm()) {
      console.log('Form validation failed:', this.errors);
      if (
        this.errors['name'] ||
        this.errors['email'] ||
        this.errors['phone'] ||
        this.errors['employeeId'] ||
        this.errors['userType']
      ) {
        this.setActiveTab('tab1');
      }
      return;
    }

    const formData = new FormData();
    formData.append('name', this.name);
    formData.append('username', this.username);
    formData.append('password', this.password);
    formData.append('email', this.email);
    formData.append('phone', this.phone || '');
    formData.append('employeeId', this.employeeId);
    formData.append('userType', this.userType);
    formData.append('isVerified', 'true');
    if (this.profilePic) {
      formData.append('profilePic', this.profilePic);
    }

    console.log('FormData being sent:', {
      name: this.name,
      username: this.username,
      password: this.password,
      email: this.email,
      phone: this.phone,
      employeeId: this.employeeId,
      userType: this.userType,
      isVerified: 'true',
      profilePic: this.profilePic ? this.profilePic.name : null,
    });

    this.backendError = '';
    this.isLoading = true;
    this.userService.createUser(formData).subscribe({
      next: (newUser) => {
        console.log('User created successfully:', newUser);
        this.users.push({
          ...newUser,
          profilePic: newUser.profilePic || '',
        });
        this.filteredUsers = [...this.users];
        this.showPassword = new Array(this.filteredUsers.length).fill(false);
        this.resetForm();
        const modal = document.getElementById('userModal');
        if (modal) {
          const bsModal = (window as any).bootstrap.Modal.getInstance(modal);
          if (bsModal) {
            bsModal.hide();
          }
        }
        this.isLoading = false;
        this.toastr.success('User created successfully!', 'Success');
        window.location.reload();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('API error:', error);
        if (error.error && error.error.errors) {
          console.log('Backend validation errors:', error.error.errors);
          const errorMessages = Object.entries(error.error.errors).map(([key, value]) => {
            return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`;
          });
          this.backendError = errorMessages.join('; ');
          this.toastr.error(this.backendError, 'Error');
          if (
            error.error.errors['name'] ||
            error.error.errors['email'] ||
            error.error.errors['phone'] ||
            error.error.errors['employeeId'] ||
            error.error.errors['userType']
          ) {
            this.setActiveTab('tab1');
          }
        } else {
          console.log('Unexpected error:', error.status, error.statusText);
          this.backendError = error.message || `Error ${error.status || 'Unknown'}: Server error. Please check the API.`;
          this.toastr.error(this.backendError, 'Error');
        }
      },
      complete: () => {
        console.log('API call completed');
        this.isLoading = false;
      },
    });
  }

  openDeleteModal(_id: string | undefined): void {
    if (!_id) {
      console.error('User ID is undefined');
      this.toastr.error('Cannot delete user: Invalid user ID.', 'Error');
      return;
    }
    this.userIdToDelete = _id;
  }

  confirmDeleteUser(): void {
    if (!this.userIdToDelete) {
      console.error('User ID is undefined');
      this.toastr.error('Cannot delete user: Invalid user ID.', 'Error');
      return;
    }

    this.isLoading = true;
    this.backendError = '';
    this.userService.deleteUser(this.userIdToDelete).subscribe({
      next: () => {
        console.log('User deleted successfully:', this.userIdToDelete);
        this.users = this.users.filter((user) => user._id !== this.userIdToDelete);
        this.filteredUsers = this.filteredUsers.filter((user) => user._id !== this.userIdToDelete);
        this.showPassword = new Array(this.filteredUsers.length).fill(false);
        this.isLoading = false;
        this.toastr.success('User deleted successfully!', 'Success');
        this.userIdToDelete = undefined;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error deleting user:', error);
        this.toastr.error(error.message || 'Failed to delete user. Please try again.', 'Error');
        this.userIdToDelete = undefined;
      },
      complete: () => {
        console.log('Delete API call completed');
        this.isLoading = false;
      },
    });
  }

  resetForm(): void {
    this.name = '';
    this.username = '';
    this.password = '';
    this.email = '';
    this.phone = '';
    this.employeeId = '';
    this.userType = 'mobile user';
    this.profilePic = null;
    this.profilePicPreview = null;
    this.activeTab = 'tab1';
    this.errors = {};
    this.backendError = '';
  }

  togglePassword(index: number): void {
    this.showPassword[index] = !this.showPassword[index];
  }

  copyToClipboard(text: string | undefined): void {
    const textToCopy = text || '';
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.toastr.success('Copied to clipboard!', 'Success');
    }).catch((err) => {
      console.error('Failed to copy:', err);
      this.toastr.error('Failed to copy to clipboard.', 'Error');
    });
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectUserType(type: string): void {
    this.selectedUserType = type;
    this.isDropdownOpen = false;
    this.filterUsers();
  }
}
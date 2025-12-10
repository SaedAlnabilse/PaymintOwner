// Global error notification service

type ErrorNotificationCallback = (title: string, message?: string) => void;

class ErrorNotificationService {
  private showErrorCallback: ErrorNotificationCallback | null = null;

  setShowErrorCallback(callback: ErrorNotificationCallback) {
    this.showErrorCallback = callback;
  }

  showError(title: string, message?: string) {
    if (this.showErrorCallback) {
      this.showErrorCallback(title, message);
    } else {
      console.error('Error Notification:', title, message);
    }
  }

  showNetworkError(message?: string) {
    this.showError('Network Error', message || 'Unable to connect to the server.');
  }

  showServerCrashError() {
    this.showError('Server Connection Failed', 'Unable to connect to the server.');
  }
  
  showServerTimeoutError() {
      this.showError('Request Timeout', 'The server is taking too long to respond.');
  }

  showServerNotRespondingError() {
      this.showError('Server Not Responding', 'The server is not responding to requests.');
  }

  showServerError(statusCode: number) {
      this.showError('Server Error', `The server encountered an error (${statusCode}).`);
  }
}

export const errorNotificationService = new ErrorNotificationService();

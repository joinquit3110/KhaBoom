import { CustomElementView, Obj } from '@mathigon/boost';

/**
 * A custom web component that displays a progress bar with steps.
 * Inspired by Mathigon's step progress component.
 * 
 * Attributes:
 * - total: The total number of steps
 * - value: The current step (1-indexed)
 * - mode: The display mode ('continuous' or 'discrete')
 */
export class StepBar extends CustomElementView {
  ready() {
    this.total = +this.attr('total') || 3;
    this.value = +this.attr('value') || 1;
    this.mode = this.attr('mode') || 'continuous';
    
    // Create the steps if in discrete mode
    if (this.mode === 'discrete') {
      this._createSteps();
    }
    
    // Set initial progress
    this._updateProgress();
    
    // Listen for attribute changes
    this.observe(['value', 'total', 'mode'], (attr, value) => {
      if (attr === 'value') {
        this.value = +value || 1;
        this._updateProgress();
      } else if (attr === 'total') {
        this.total = +value || 3;
        if (this.mode === 'discrete') {
          this._clearSteps();
          this._createSteps();
        }
        this._updateProgress();
      } else if (attr === 'mode') {
        this.mode = value || 'continuous';
        this._clearSteps();
        if (this.mode === 'discrete') {
          this._createSteps();
        }
        this._updateProgress();
      }
    });
  }
  
  /**
   * Creates the individual step markers
   * @private
   */
  _createSteps() {
    for (let i = 1; i <= this.total; i++) {
      const step = document.createElement('div');
      step.className = 'step';
      step.dataset.step = i;
      
      // Create the step marker
      const marker = document.createElement('div');
      marker.className = 'step-marker';
      
      // Create the step label
      const label = document.createElement('div');
      label.className = 'step-label';
      label.textContent = i;
      
      step.appendChild(marker);
      step.appendChild(label);
      
      // Add click handler to navigate to step (if enabled)
      step.addEventListener('click', () => {
        this.value = i;
        this.attr('value', i);
        this._updateProgress();
        this.trigger('step-change', { value: i });
      });
      
      this.appendChild(step);
    }
    
    // Adjust the step positions
    this._positionSteps();
  }
  
  /**
   * Positions the steps evenly across the bar
   * @private
   */
  _positionSteps() {
    const steps = this.$$('.step');
    steps.forEach((step, i) => {
      const percent = (i / (this.total - 1)) * 100;
      step.style.left = `${percent}%`;
    });
  }
  
  /**
   * Clears all steps from the bar
   * @private
   */
  _clearSteps() {
    const steps = this.$$('.step');
    steps.forEach(step => step.remove());
  }
  
  /**
   * Updates the progress display
   * @private
   */
  _updateProgress() {
    // Ensure value is within bounds
    this.value = Math.max(1, Math.min(this.value, this.total));
    
    // Calculate progress percentage
    const progress = ((this.value - 1) / (this.total - 1)) * 100;
    
    // Set the CSS variable for progress
    this.style.setProperty('--progress', `${progress}%`);
    
    if (this.mode === 'discrete') {
      // Update active state of steps
      const steps = this.$$('.step');
      steps.forEach((step, i) => {
        const stepNum = i + 1;
        if (stepNum < this.value) {
          step.classList.add('completed');
          step.classList.remove('active');
        } else if (stepNum === this.value) {
          step.classList.add('active');
          step.classList.remove('completed');
        } else {
          step.classList.remove('active', 'completed');
        }
      });
    }
  }
  
  /**
   * Go to the next step
   */
  next() {
    if (this.value < this.total) {
      this.value++;
      this.attr('value', this.value);
      this._updateProgress();
      this.trigger('step-change', { value: this.value });
      return true;
    }
    return false;
  }
  
  /**
   * Go to the previous step
   */
  prev() {
    if (this.value > 1) {
      this.value--;
      this.attr('value', this.value);
      this._updateProgress();
      this.trigger('step-change', { value: this.value });
      return true;
    }
    return false;
  }
  
  /**
   * Go to a specific step
   * @param {number} step - The step to go to (1-indexed)
   */
  goToStep(step) {
    if (step >= 1 && step <= this.total) {
      this.value = step;
      this.attr('value', step);
      this._updateProgress();
      this.trigger('step-change', { value: step });
      return true;
    }
    return false;
  }
} 
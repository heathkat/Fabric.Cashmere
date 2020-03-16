import {Component, Input, AfterContentInit, HostBinding, ViewEncapsulation, Output, EventEmitter} from '@angular/core';
import {Router, NavigationEnd} from '@angular/router';
import {parseBooleanAttribute} from '../util';

export function throwErrorForMissingRouterLink(stepsWithoutRouterLink: StepInterface[]) {
    const stepLabels = stepsWithoutRouterLink.map(step => step.label);
    throw Error(`Routerlink missing on ${stepLabels.join(',')}`);
}

export interface StepInterface {
    /** The text to be displayed under the step indicator */
    label?: string;
    /** If using a router, the route this step should navigate to */
    routerLink?: string;
    /** The icon set the step's hc-icon should use. Must be set if using the icon parameter. */
    iconSet?: string;
    /** An glyph that should be displayed inside the step's circle.
     * If not set, the step number will display in the circle instead. */
    icon?: string;
    /** If true, the step will not be clickable */
    disabled?: boolean;
}

export type StepColor = 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'none';
export type StepType = 'arrow' | 'isolated';

/** Convey progress through numbered steps, providing a wizard-like workflow.  */
@Component({
    selector: 'hc-stepper',
    templateUrl: './stepper.component.html',
    styleUrls: ['./stepper.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class StepperComponent implements AfterContentInit {
    _routerEnabled = false;

    /** An array defining the steps in the stepper */
    @Input()
    public steps: StepInterface[];

    /** Sets the layout of the progress stepper. *Defaults to `arrow`.*  */
    @Input()
    public type: StepType = 'arrow';

    /** Sets the highlight color of the progress stepper. *Defaults to `green`.*  */
    @Input()
    get color(): StepColor {
        return this._color;
    }
    set color(value: StepColor) {
        this._color = value;
        this._hostClass = 'hc-stepper-' + this._color;
    }
    private _color: StepColor = 'green';

    /** Determines whether numerals should be displayed on each step indicator for the isolated type.
     * *Defaults to `false`.*  */
    @Input()
    get showStepCount(): boolean {
        return this._showStepCount;
    }
    set showStepCount(value) {
        this._showStepCount = parseBooleanAttribute(value);
    }
    private _showStepCount = false;

    /** If true, include a router outlet with the component. *Defaults to `true`.*  */
    @Input()
    get useRouterOutlet(): boolean {
        return this._useRouterOutlet;
    }
    set useRouterOutlet(value) {
        this._useRouterOutlet = parseBooleanAttribute(value);
    }
    private _useRouterOutlet = true;

    /** Get or set the currently selected zero-based index of the stepper */
    @Input()
    get activeIndex(): number {
        return this._activeIndex;
    }
    set activeIndex(value: number) {
        if (!this.steps) {
            return;
        }
        // if (value !== undefined && (value < 0 || value >= this.steps.length)) {
        //     throw Error('The hc-stepper activeIndex value of ' + value + ' is out of bounds');
        // }
        if (this._routerEnabled && value) {
            this.router.navigate([this.steps[value].routerLink]);
        } else {
            this._activeIndex = value;
            this.activeIndexChange.emit(this._activeIndex);
        }
    }
    private _activeIndex = -1;

    /** Emits the current zero-based index for the active step whenever it changes */
    @Output()
    activeIndexChange = new EventEmitter<number>();

    @HostBinding('class') _hostClass = 'hc-stepper-' + this.color;

    constructor(private router: Router) {
        this.router.events.forEach(event => {
            if (event instanceof NavigationEnd) {
                const url = event && event.url ? event.url : '';
                this._findCurrentStep(url);
            }
        });
    }

    ngAfterContentInit() {
        this._checkForRouterUse();
        this._findCurrentStep(this.router.url);
    }

    _stepClick(index: number) {
        if (!this._routerEnabled && this.steps[index].disabled !== true) {
            this._activeIndex = index;
            this.activeIndexChange.emit(this._activeIndex);
        }
    }

    private _checkForRouterUse() {
        const countUsingRouter = this.steps.filter(step => step.routerLink !== undefined).length;
        if (countUsingRouter > 0 && countUsingRouter < this.steps.length) {
            const stepMissingRouterLink = this.steps.filter(step => step.routerLink === undefined);
            throwErrorForMissingRouterLink(stepMissingRouterLink);
        } else {
            this._routerEnabled = countUsingRouter === this.steps.length;
        }
    }

    private _findCurrentStep(currentRoute: string) {
        if (this._activeIndex === -1) {
            const foundActiveRoute = this.steps.findIndex(step => currentRoute === step.routerLink);
            this._activeIndex = foundActiveRoute > -1 ? foundActiveRoute : -1;
            this.activeIndexChange.emit(this._activeIndex);
        }
    }
}

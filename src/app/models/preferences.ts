import { TemplateRef } from "@angular/core";

export interface PanelGroup {
    index: number;
    name: string;
    icon: string;
    isOpen: boolean;
    fragments: TemplateRef<any>;
    isDynamic: boolean;
}
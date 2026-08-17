import { Component } from "react";
import Dialog from "./Dialog";

type ChatDialogBoundaryProps = {
    open: boolean;
    title: string;
    onClose: () => void;
    children: any;
};

type ChatDialogBoundaryState = {
    hasError: boolean;
};

export default class ChatDialogBoundary extends Component<ChatDialogBoundaryProps, ChatDialogBoundaryState> {
    state: ChatDialogBoundaryState = {
        hasError: false
    };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidUpdate(prevProps: ChatDialogBoundaryProps) {
        if ((!prevProps.open && this.props.open) || prevProps.title !== this.props.title) {
            if (this.state.hasError) {
                this.setState({ hasError: false });
            }
        }
    }

    render() {
        if (this.state.hasError) {
            return <Dialog open={this.props.open} title={this.props.title} onClose={this.props.onClose}>
                <div className="form-row">
                    <p>Der Nachrichtenverlauf konnte für diesen Vorgang nicht geladen werden.</p>
                    <p>Bitte den Dialog schließen und den Vorgang erneut öffnen.</p>
                </div>
            </Dialog>;
        }

        return this.props.children;
    }
}

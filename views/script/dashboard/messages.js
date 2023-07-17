function newConversation() {
    createPrompt({
        head: 'Nouvelle conversation',
        placeholder: 'Nom de la conversation',
        action: 'createConversation()',
        list: 'users'
    });
}
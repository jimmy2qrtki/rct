function toggleEdit(editMode) {
    const displayDiv = document.getElementById('profile-display');
    const editDiv = document.getElementById('profile-edit');
    if (editMode) {
        displayDiv.style.display = 'none';
        editDiv.style.display = 'block';
    } else {
        displayDiv.style.display = 'block';
        editDiv.style.display = 'none';
    }
}
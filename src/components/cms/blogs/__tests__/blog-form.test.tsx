import { render, screen, fireEvent, waitFor } from'@testing-library/react';
import { describe, it, expect, beforeEach, vi } from'vitest';
import { BlogForm } from'../blog-form';
import type { Blog } from'@/src/common/@types/@cms-blog';

describe('BlogForm', () => {
 const mockOnSubmit = vi.fn();
 const mockOnCancel = vi.fn();

 const mockBlog: Blog = {
 id: 1,
 tenant_id: 1,
 name:'Test Blog',
 slug:'test-blog',
 description:'Test Description',
 secret_key:'test-key',
 created_at:'2024-01-01T00:00:00Z',
 updated_at:'2024-01-01T00:00:00Z',
 };

 beforeEach(() => {
 vi.clearAllMocks();
 });

 describe('Create Mode', () => {
 it('renders empty form in create mode', () => {
 render(
 <BlogForm
 onSubmit={mockOnSubmit}
 onCancel={mockOnCancel}
 isSubmitting={false}
 />
 );

 expect(screen.getByLabelText(/Blog Name/i)).toHaveValue('');
 expect(screen.getByLabelText(/Description/i)).toHaveValue('');
 expect(screen.getByText('Create Blog')).toBeInTheDocument();
 });

 it('shows character count for name field', () => {
 render(
 <BlogForm
 onSubmit={mockOnSubmit}
 onCancel={mockOnCancel}
 isSubmitting={false}
 />
 );

 expect(screen.getByText('0/150 characters')).toBeInTheDocument();
 });

 it('shows character count for description field', () => {
 render(
 <BlogForm
 onSubmit={mockOnSubmit}
 onCancel={mockOnCancel}
 isSubmitting={false}
 />
 );

 expect(screen.getByText('0/500 characters')).toBeInTheDocument();
 });

 it('validates required name field', async () => {
 render(
 <BlogForm
 onSubmit={mockOnSubmit}
 onCancel={mockOnCancel}
 isSubmitting={false}
 />
 );

 const submitButton = screen.getByText('Create Blog');
 fireEvent.click(submitButton);

 await waitFor(() => {
 expect(screen.getByText(/Blog name is required/i)).toBeInTheDocument();
 });

 expect(mockOnSubmit).not.toHaveBeenCalled();
 });

 it('validates name max length (150 characters)', async () => {
 render(
 <BlogForm
 onSubmit={mockOnSubmit}
 onCancel={mockOnCancel}
 isSubmitting={false}
 />
 );

 const nameInput = screen.getByLabelText(/Blog Name/i);
 const longName ='a'.repeat(151);
 
 fireEvent.change(nameInput, { target: { value: longName } });
 fireEvent.click(screen.getByText('Create Blog'));

 await waitFor(() => {
 expect(screen.getByText(/must be 150 characters or less/i)).toBeInTheDocument();
 });

 expect(mockOnSubmit).not.toHaveBeenCalled();
 });

 it('validates description max length (500 characters)', async () => {
 render(
 <BlogForm
 onSubmit={mockOnSubmit}
 onCancel={mockOnCancel}
 isSubmitting={false}
 />
 );

 const nameInput = screen.getByLabelText(/Blog Name/i);
 const descriptionInput = screen.getByLabelText(/Description/i);
 const longDescription ='a'.repeat(501);
 
 fireEvent.change(nameInput, { target: { value:'Valid Name' } });
 fireEvent.change(descriptionInput, { target: { value: longDescription } });
 fireEvent.click(screen.getByText('Create Blog'));

 await waitFor(() => {
 expect(screen.getByText(/must be 500 characters or less/i)).toBeInTheDocument();
 });

 expect(mockOnSubmit).not.toHaveBeenCalled();
 });

 it('submits valid form data', async () => {
 render(
 <BlogForm
 onSubmit={mockOnSubmit}
 onCancel={mockOnCancel}
 isSubmitting={false}
 />
 );

 const nameInput = screen.getByLabelText(/Blog Name/i);
 const descriptionInput = screen.getByLabelText(/Description/i);

 fireEvent.change(nameInput, { target: { value:'My Blog' } });
 fireEvent.change(descriptionInput, { target: { value:'My Description' } });
 fireEvent.click(screen.getByText('Create Blog'));

 await waitFor(() => {
 expect(mockOnSubmit).toHaveBeenCalledWith({
 name:'My Blog',
 description:'My Description',
 });
 });
 });

 it('calls onCancel when cancel button is clicked', () => {
 render(
 <BlogForm
 onSubmit={mockOnSubmit}
 onCancel={mockOnCancel}
 isSubmitting={false}
 />
 );

 fireEvent.click(screen.getByText('Cancel'));
 expect(mockOnCancel).toHaveBeenCalled();
 });
 });

 describe('Edit Mode', () => {
 it('renders form with blog data in edit mode', () => {
 render(
 <BlogForm
 blog={mockBlog}
 onSubmit={mockOnSubmit}
 onCancel={mockOnCancel}
 isSubmitting={false}
 />
 );

 expect(screen.getByLabelText(/Blog Name/i)).toHaveValue('Test Blog');
 expect(screen.getByLabelText(/Description/i)).toHaveValue('Test Description');
 expect(screen.getByText('Update Blog')).toBeInTheDocument();
 });

 it('updates character counts based on existing data', () => {
 render(
 <BlogForm
 blog={mockBlog}
 onSubmit={mockOnSubmit}
 onCancel={mockOnCancel}
 isSubmitting={false}
 />
 );

 expect(screen.getByText('9/150 characters')).toBeInTheDocument(); //"Test Blog" = 9 chars
 expect(screen.getByText('16/500 characters')).toBeInTheDocument(); //"Test Description" = 16 chars
 });

 it('submits updated form data', async () => {
 render(
 <BlogForm
 blog={mockBlog}
 onSubmit={mockOnSubmit}
 onCancel={mockOnCancel}
 isSubmitting={false}
 />
 );

 const nameInput = screen.getByLabelText(/Blog Name/i);
 fireEvent.change(nameInput, { target: { value:'Updated Blog' } });
 fireEvent.click(screen.getByText('Update Blog'));

 await waitFor(() => {
 expect(mockOnSubmit).toHaveBeenCalledWith({
 name:'Updated Blog',
 description:'Test Description',
 });
 });
 });
 });

 describe('Submitting State', () => {
 it('disables form inputs when submitting', () => {
 render(
 <BlogForm
 onSubmit={mockOnSubmit}
 onCancel={mockOnCancel}
 isSubmitting={true}
 />
 );

 expect(screen.getByLabelText(/Blog Name/i)).toBeDisabled();
 expect(screen.getByLabelText(/Description/i)).toBeDisabled();
 expect(screen.getByText('Cancel')).toBeDisabled();
 });

 it('shows loading text when submitting in create mode', () => {
 render(
 <BlogForm
 onSubmit={mockOnSubmit}
 onCancel={mockOnCancel}
 isSubmitting={true}
 />
 );

 expect(screen.getByText('Creating...')).toBeInTheDocument();
 });

 it('shows loading text when submitting in edit mode', () => {
 render(
 <BlogForm
 blog={mockBlog}
 onSubmit={mockOnSubmit}
 onCancel={mockOnCancel}
 isSubmitting={true}
 />
 );

 expect(screen.getByText('Updating...')).toBeInTheDocument();
 });
 });
});

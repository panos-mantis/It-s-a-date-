import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, NETWORK_MESSAGE } from '../../lib/api';
import { expectNoAxeViolations } from '../../test/axe';
import { PhotoDropZone, type PhotoValue } from './PhotoDropZone';

const REJECTED = "That photo didn't upload. Try a JPEG, PNG or WebP under 5 MB.";
const IMAGE: PhotoValue = {
  url: 'https://res.cloudinary.com/demo/image/upload/a.jpg',
  publicId: 'a',
};

const jpeg = (name = 'pastry-walk.jpg') => new File(['x'], name, { type: 'image/jpeg' });

type Upload = (input: { file: File; onProgress?: (pct: number) => void }) => Promise<PhotoValue>;

function Harness({
  upload,
  onBusy,
  initial = null,
}: {
  upload: Upload;
  onBusy?: (b: boolean) => void;
  initial?: PhotoValue | null;
}) {
  const [value, setValue] = useState<PhotoValue | null>(initial);
  return (
    <>
      <PhotoDropZone value={value} onChange={setValue} upload={upload} onUploadingChange={onBusy} />
      <output data-testid="value">{value ? value.publicId : 'none'}</output>
    </>
  );
}

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;
const pick = (file: File) => fireEvent.change(fileInput(), { target: { files: [file] } });

describe('PhotoDropZone', () => {
  it('starts with the drop zone copy', async () => {
    const { container } = render(<Harness upload={() => Promise.resolve(IMAGE)} />);
    expect(screen.getByText('Add a photo')).toBeInTheDocument();
    expect(screen.getByText(/Drag it here or/)).toBeInTheDocument();
    expect(screen.getByText('JPEG, PNG or WebP, up to 5 MB')).toBeInTheDocument();
    expect(screen.getByLabelText(/add a photo/i)).toBe(fileInput());
    await expectNoAxeViolations(container);
  });

  it('uploads on pick, shows the preview and moves focus to Replace', async () => {
    const onBusy = vi.fn();
    const upload = vi.fn<Upload>().mockResolvedValue(IMAGE);
    const { container } = render(<Harness upload={upload} onBusy={onBusy} />);
    pick(jpeg());
    expect(await screen.findByRole('button', { name: 'Replace' })).toHaveFocus();
    expect(screen.getByRole('img', { name: /pastry-walk\.jpg/ })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('a'));
    expect(upload.mock.calls[0]?.[0].file).toBeInstanceOf(File);
    expect(onBusy).toHaveBeenCalledWith(true);
    expect(onBusy).toHaveBeenLastCalledWith(false);
    await expectNoAxeViolations(container);
  });

  it('shows progress while uploading and reports it as busy', async () => {
    let finish: (v: PhotoValue) => void = () => undefined;
    const upload: Upload = ({ onProgress }) =>
      new Promise((resolve) => {
        onProgress?.(64);
        finish = resolve;
      });
    const onBusy = vi.fn();
    render(<Harness upload={upload} onBusy={onBusy} />);
    pick(jpeg());
    const bar = await screen.findByRole('progressbar', { name: 'Photo upload' });
    expect(bar).toHaveAttribute('aria-valuenow', '64');
    expect(screen.getByText('Uploading pastry-walk.jpg…')).toBeInTheDocument();
    expect(onBusy).toHaveBeenLastCalledWith(true);
    finish(IMAGE);
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    expect(onBusy).toHaveBeenLastCalledWith(false);
  });

  it('rejected file shows the R23 message verbatim, before any upload', async () => {
    const upload = vi.fn<Upload>();
    render(<Harness upload={upload} />);
    pick(new File(['x'], 'notes.pdf', { type: 'application/pdf' }));
    expect(await screen.findByText(REJECTED)).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Add a photo')).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
  });

  it('rejects a file over 5 MB with the same message', async () => {
    const upload = vi.fn<Upload>();
    render(<Harness upload={upload} />);
    const big = jpeg('big.jpg');
    Object.defineProperty(big, 'size', { value: 5 * 1024 * 1024 + 1 });
    pick(big);
    expect(await screen.findByText(REJECTED)).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
  });

  it('shows the same message when the API rejects the file', async () => {
    const upload: Upload = () =>
      Promise.reject(new ApiError(422, 'VALIDATION', 'Use a JPEG, PNG or WebP image under 5 MB'));
    render(<Harness upload={upload} />);
    pick(jpeg());
    expect(await screen.findByText(REJECTED)).toBeInTheDocument();
    expect(screen.getByText('Add a photo')).toBeInTheDocument();
  });

  it('network failure keeps the preview and offers Try again', async () => {
    const upload = vi
      .fn<Upload>()
      .mockRejectedValueOnce(new ApiError(0, 'NETWORK', NETWORK_MESSAGE))
      .mockResolvedValueOnce(IMAGE);
    const user = userEvent.setup();
    render(<Harness upload={upload} />);
    pick(jpeg());
    expect(await screen.findByText("pastry-walk.jpg didn't finish uploading.")).toHaveAttribute(
      'role',
      'alert',
    );
    expect(screen.getByRole('img', { name: /pastry-walk\.jpg/ })).toBeInTheDocument();
    expect(screen.getByTestId('value')).toHaveTextContent('none');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('a'));
    expect(upload).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('Remove clears the photo and brings back the drop zone', async () => {
    const user = userEvent.setup();
    render(<Harness upload={() => Promise.resolve(IMAGE)} />);
    pick(jpeg());
    await screen.findByRole('button', { name: 'Replace' });
    await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('a'));
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.getByTestId('value')).toHaveTextContent('none');
    expect(screen.getByText('Add a photo')).toBeInTheDocument();
  });

  it('shows an existing photo with Replace and Remove', () => {
    render(<Harness upload={() => Promise.resolve(IMAGE)} initial={IMAGE} />);
    expect(screen.getByRole('img', { name: 'Your photo' })).toHaveAttribute('src', IMAGE.url);
    expect(screen.getByRole('button', { name: 'Replace' })).toBeInTheDocument();
  });

  it('revokes object URLs on replace, remove and unmount', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    const create = vi.spyOn(URL, 'createObjectURL');
    const user = userEvent.setup();
    const { unmount } = render(<Harness upload={() => Promise.resolve(IMAGE)} />);
    pick(jpeg('one.jpg'));
    await screen.findByRole('button', { name: 'Replace' });
    const first = create.mock.results[0]?.value as string;
    pick(jpeg('two.jpg'));
    await waitFor(() => expect(revoke).toHaveBeenCalledWith(first));
    const second = create.mock.results[1]?.value as string;
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(revoke).toHaveBeenCalledWith(second);
    pick(jpeg('three.jpg'));
    await screen.findByRole('button', { name: 'Replace' });
    const third = create.mock.results[2]?.value as string;
    unmount();
    expect(revoke).toHaveBeenCalledWith(third);
    revoke.mockRestore();
    create.mockRestore();
  });

  it('accepts a dropped file', async () => {
    const upload = vi.fn<Upload>().mockResolvedValue(IMAGE);
    render(<Harness upload={upload} />);
    fireEvent.drop(screen.getByText('Add a photo').closest('label') as HTMLElement, {
      dataTransfer: { files: [jpeg()] },
    });
    await waitFor(() => expect(upload).toHaveBeenCalled());
  });
});

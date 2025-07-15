
import { useToast } from '../hooks/use-toast';
import { renderHook } from '@testing-library/react';

describe('useToast', () => {
  it('should be defined', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current).toBeDefined();
  });
});

import React, { KeyboardEventHandler } from 'react';

import CreatableSelect from 'react-select/creatable';
import showToast from './Toasts';
import { selectStyles } from './MutliSelect';
import FakeSelect from './FakeSelect';

const components = {
  DropdownIndicator: null,
};

interface Option {
  readonly label: string;
  readonly value: string;
}

const createOption = (label: string) => ({
  label,
  value: label,
});

interface CreateableSelectProps {
  value: readonly Option[];
  setValue: React.Dispatch<React.SetStateAction<readonly Option[]>>;
}
const CreateableSelect: React.FC<CreateableSelectProps> = ({
  value,
  setValue,
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleKeyDown: KeyboardEventHandler = (event) => {
    if (!inputValue) return;
    if (inputValue.length > 20) {
      showToast('Value is too long', 'error', 'longValue');
      setInputValue('');
    }
    switch (event.key) {
      case 'Enter':
      case 'Tab':
        const cleanedInputValue = inputValue;
        if (!cleanedInputValue.length) {
          showToast('Invalid value', 'error', 'invalidValue');
          return;
        }
        if (value.find((v) => v.label === cleanedInputValue)) {
          showToast('Value already exists', 'error', 'existingValue');
          return;
        }
        if (cleanedInputValue.length > 50) {
          showToast('Value is too long', 'error', 'longValue');
          return;
        }
        setValue((prev) => [...prev, createOption(cleanedInputValue)]);
        setInputValue('');
        event.preventDefault();
    }
  };

  return (
    <>
      {isClient ? (
        <CreatableSelect
          components={components}
          inputValue={inputValue}
          isClearable
          isMulti
          menuIsOpen={false}
          onChange={(newValue) => setValue(newValue as readonly Option[])}
          onInputChange={(newValue) => setInputValue(newValue)}
          onKeyDown={handleKeyDown}
          placeholder="Type something and press enter..."
          value={value}
          styles={selectStyles}
        />
      ) : (
        <FakeSelect innerText="Type something and press enter..." />
      )}
    </>
  );
};

export default CreateableSelect;
